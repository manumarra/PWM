// Geocoding (Nominatim) e distanza stradale (OSRM), entrambi basati su OpenStreetMap

const USER_AGENT = "FastFoodUniProject/1.0 (esame@gmail.com)";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";
//const OSRM_URL = "https://router.invalid/route/v1/driving";
const TIMEOUT_MS = 6000;
const MIN_INTERVAL_MS = 1100; // Nominatim ammette al massimo 1 richiesta al secondo

const geoError = (status, message) => Object.assign(new Error(message), { status });

// Distanzia le richieste a Nominatim
let nextSlot = 0;
const waitForSlot = async () => {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + MIN_INTERVAL_MS;
  if (slot > now) await new Promise((resolve) => setTimeout(resolve, slot - now));
};

// Cache indirizzo -> coordinate
const cache = new Map();
const CACHE_MAX = 500;

export async function geocode(street, city) {
  const key = `${street}|${city}`.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key);

  await waitForSlot();
  let data;
  try {
    const q = encodeURIComponent(`${street}, ${city}, Italy`);
    const res = await fetch(`${NOMINATIM_URL}?format=json&limit=1&q=${q}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error("Errore geocoding:", err.message);
    throw geoError(503, "Servizio di localizzazione non disponibile, riprova tra poco");
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw geoError(400, "Indirizzo non trovato sulla mappa");
  }

  const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(key, coords);
  return coords;
}

// Distanza in linea d'aria: ripiego se OSRM non risponde
export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Distanza stradale e tracciato. method: "road" (OSRM) oppure "air" (ripiego)
export async function drivingRoute(from, to) {
  try {
    const url = `${OSRM_URL}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    const route = data.routes?.[0];
    if (data.code !== "Ok" || !route) throw new Error(`OSRM code ${data.code}`);

    return {
      km: route.distance / 1000,
      path: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      method: "road"
    };
  } catch (err) {
    console.warn("OSRM non disponibile, uso la distanza in linea d'aria:", err.message);
    return {
      km: haversineKm(from, to),
      path: [[from.lat, from.lon], [to.lat, to.lon]],
      method: "air"
    };
  }
}