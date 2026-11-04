// scripts/check-swagger.mjs
// Uso (dalla radice del repository):
//   node scripts/check-swagger.mjs
//
// Controlla che la documentazione (src/docs/openapi.yaml) sia coerente con il codice:
//   1. ogni route Express è documentata, e ogni operazione documentata esiste davvero;
//   2. la specifica è ben formata: operationId unici, riferimenti ($ref) risolvibili,
//      parametri di percorso dichiarati, tag e schemi di sicurezza esistenti.
// Esce con codice 1 se trova problemi: si può usare anche prima di una consegna.

import fs from "fs";
import path from "path";
import { load as loadYaml } from "js-yaml";

const SPEC_FILE = path.join("src", "docs", "openapi.yaml");
const ROUTES_DIR = path.join("src", "routes");
const APP_FILE = path.join("src", "app.js");
const API_PREFIX = "/api";
const METHODS = ["get", "post", "put", "patch", "delete"];

const errors = [];
const fail = (message) => errors.push(message);

/* ------------------------------------------------------------------ */
/*  1. Specifica                                                       */
/* ------------------------------------------------------------------ */

if (!fs.existsSync(SPEC_FILE)) {
  console.error(`❌ File non trovato: ${SPEC_FILE}`);
  process.exit(1);
}

let spec;
try {
  spec = loadYaml(fs.readFileSync(SPEC_FILE, "utf-8"));
} catch (err) {
  console.error(`❌ Il file YAML non è valido: ${err.message}`);
  process.exit(1);
}

if (typeof spec?.openapi !== "string" || !spec.openapi.startsWith("3.0")) {
  fail(`"openapi" deve essere una versione 3.0.x (trovato: ${spec?.openapi})`);
}
if (!spec?.info?.title || !spec?.info?.version) fail('"info" deve avere "title" e "version"');
if (!spec?.paths || Object.keys(spec.paths).length === 0) fail('"paths" è vuoto');

const specOperations = new Map(); // "METHOD /percorso" -> operazione
for (const [route, item] of Object.entries(spec.paths || {})) {
  for (const method of METHODS) {
    if (item?.[method]) specOperations.set(`${method.toUpperCase()} ${route}`, { route, method, op: item[method], item });
  }
}

/* ------------------------------------------------------------------ */
/*  2. Route del codice                                                */
/* ------------------------------------------------------------------ */

const toOpenApiPath = (p) => p.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
const joinPaths = (base, sub) => (sub === "/" ? base : base.replace(/\/$/, "") + sub);

const codeRoutes = new Set();

const appSource = fs.existsSync(APP_FILE) ? fs.readFileSync(APP_FILE, "utf-8") : "";
if (!appSource) fail(`File non trovato: ${APP_FILE}`);

// variabile importata -> nome del file di route
const importedRoutes = new Map();
for (const m of appSource.matchAll(/import\s+(\w+)(?:\s*,\s*\{[^}]*\})?\s+from\s+["']\.\/routes\/([\w-]+)\.js["']/g)) {
  importedRoutes.set(m[1], m[2]);
}

// app.use("/api/xyz", variabileRoute)
const mounts = [];
for (const m of appSource.matchAll(/app\.use\(\s*["']([^"']+)["']\s*,\s*(\w+)\s*\)/g)) {
  if (importedRoutes.has(m[2])) mounts.push({ base: m[1], file: importedRoutes.get(m[2]) });
}

for (const { base, file } of mounts) {
  const filePath = path.join(ROUTES_DIR, `${file}.js`);
  if (!fs.existsSync(filePath)) { fail(`File di route non trovato: ${filePath}`); continue; }
  const source = fs.readFileSync(filePath, "utf-8");
  for (const m of source.matchAll(/router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g)) {
    codeRoutes.add(`${m[1].toUpperCase()} ${joinPaths(base, m[2])}`);
  }
}

// route definite direttamente in app.js (es. il webhook di Stripe)
for (const m of appSource.matchAll(/app\.(get|post|put|patch|delete)\(\s*["'](\/api\/[^"']*)["']/g)) {
  codeRoutes.add(`${m[1].toUpperCase()} ${m[2]}`);
}

// in forma relativa a /api, con {parametro}
const codeOperations = new Set(
  [...codeRoutes].map((r) => {
    const [method, route] = r.split(" ");
    const rel = route.startsWith(API_PREFIX + "/") ? route.slice(API_PREFIX.length) : route;
    return `${method} ${toOpenApiPath(rel)}`;
  })
);

for (const op of codeOperations) {
  if (!specOperations.has(op)) fail(`Route NON documentata: ${op}`);
}
for (const op of specOperations.keys()) {
  if (!codeOperations.has(op)) fail(`Operazione documentata ma NON presente nel codice: ${op}`);
}

/* ------------------------------------------------------------------ */
/*  3. Coerenza interna della specifica                                */
/* ------------------------------------------------------------------ */

const resolveRef = (ref) => {
  if (!ref.startsWith("#/")) return undefined;
  return ref.slice(2).split("/").reduce(
    (node, part) => node?.[part.replace(/~1/g, "/").replace(/~0/g, "~")],
    spec
  );
};

// tutti i $ref devono puntare a qualcosa che esiste
let refCount = 0;
const walk = (node, where) => {
  if (Array.isArray(node)) { node.forEach((n, i) => walk(n, `${where}[${i}]`)); return; }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "$ref" && typeof value === "string") {
        refCount++;
        if (resolveRef(value) === undefined) fail(`Riferimento non risolvibile ${value} (in ${where})`);
      } else {
        walk(value, `${where}/${key}`);
      }
    }
  }
};
walk(spec, "#");

const declaredTags = new Set((spec.tags || []).map((t) => t.name));
const securitySchemes = new Set(Object.keys(spec.components?.securitySchemes || {}));
const operationIds = new Map();

for (const [key, { route, op, item }] of specOperations) {
  if (!op.operationId) fail(`${key}: manca "operationId"`);
  else if (operationIds.has(op.operationId)) fail(`${key}: operationId "${op.operationId}" già usato da ${operationIds.get(op.operationId)}`);
  else operationIds.set(op.operationId, key);

  if (!op.summary) fail(`${key}: manca "summary"`);
  if (!op.responses || Object.keys(op.responses).length === 0) fail(`${key}: nessuna risposta documentata`);
  for (const tag of op.tags || []) if (!declaredTags.has(tag)) fail(`${key}: tag "${tag}" non dichiarato in "tags"`);
  if (!(op.tags || []).length) fail(`${key}: nessun tag`);

  for (const requirement of op.security || []) {
    for (const name of Object.keys(requirement)) if (!securitySchemes.has(name)) fail(`${key}: schema di sicurezza "${name}" inesistente`);
  }

  // parametri di percorso: ogni {x} del percorso deve essere dichiarato (obbligatorio, in path)
  const params = [...(item.parameters || []), ...(op.parameters || [])].map((p) => (p.$ref ? resolveRef(p.$ref) : p)).filter(Boolean);
  for (const [, name] of route.matchAll(/\{([^}]+)\}/g)) {
    const found = params.find((p) => p.in === "path" && p.name === name);
    if (!found) fail(`${key}: parametro di percorso {${name}} non dichiarato`);
    else if (found.required !== true) fail(`${key}: il parametro {${name}} deve essere "required: true"`);
  }
  const seen = new Set();
  for (const p of params) {
    const id = `${p.in}:${p.name}`;
    if (seen.has(id)) fail(`${key}: parametro ${id} dichiarato due volte`);
    seen.add(id);
    if (p.in === "path" && !route.includes(`{${p.name}}`)) fail(`${key}: il parametro di percorso "${p.name}" non compare nell'indirizzo`);
  }

  if (op.requestBody && !op.requestBody.content) fail(`${key}: "requestBody" senza "content"`);
}

/* ------------------------------------------------------------------ */
/*  Esito                                                              */
/* ------------------------------------------------------------------ */

console.log(`Specifica: ${spec.info?.title} v${spec.info?.version} (OpenAPI ${spec.openapi})`);
console.log(`Operazioni documentate: ${specOperations.size} | route nel codice: ${codeOperations.size} | riferimenti $ref controllati: ${refCount}`);

if (errors.length > 0) {
  console.error(`\n❌ ${errors.length} problemi trovati:\n`);
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}

console.log("\n✅ La documentazione è coerente con il codice.");