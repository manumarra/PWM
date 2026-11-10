# FastFood

Applicazione web per l'**ordinazione online in una catena di ristoranti**: i ristoratori gestiscono
menu e ordini, i clienti cercano piatti e ristoranti, ordinano con ritiro in locale o consegna a
domicilio e pagano con carta.

Progetto di **Programmazione Web e Mobile**, A.A. 2025/2026.
Autore: _[Manuel Marrali, 05325A]_

## Funzionalità

**Utenti**
- Registrazione, accesso, modifica ed eliminazione del profilo, con due ruoli: **cliente** e **ristoratore**.

**Ristoratore**
- Dati del ristorante (nome, telefono, partita IVA, indirizzo).
- Menu composto da piatti scelti dal **catalogo comune** (`meals.json`) o inventati da lui, con ingredienti,
  foto, tipologia, prezzo, sconto e disponibilità.
- Gestione degli ordini su bacheca Kanban, con codice di verifica alla consegna.
- Notifiche in tempo quasi reale (nuovi ordini) e **statistiche** per ristorante: incassi, ordini per giorno e
  per fascia oraria, piatti più venduti.

**Cliente**
- Ricerca dei **ristoranti** per luogo, nome e piatto.
- Ricerca dei **piatti** per tipologia, nome, prezzo, ingredienti e **allergeni da evitare**.
- Carrello e ordine con **ritiro in locale** (con tempo di attesa calcolato dalla coda del ristorante) oppure
  **consegna a domicilio** (distanza stradale calcolata con OpenStreetMap, costo in base ai km).
- Pagamento con carta (Stripe in modalità test oppure simulato) e storico degli ordini, presenti e passati.

## Tecnologie

| Parte | Strumenti |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (moduli ES), Bootstrap 5, Leaflet (mappe), Chart.js (grafici) |
| Backend | Node.js, Express, MongoDB con Mongoose |
| Sicurezza | JWT in cookie httpOnly, password con bcrypt, controlli di ruolo e di proprietà lato server |
| Servizi esterni | Stripe Checkout (pagamenti), Nominatim e OSRM di OpenStreetMap (geocoding e percorsi) |
| Documentazione API | OpenAPI 3 con Swagger UI |

## Requisiti
- **Node.js 18 o superiore** (sviluppato con Node 24)
- **MongoDB**, locale oppure su Atlas
- _Facoltativi_: un account Stripe in modalità test e la Stripe CLI

## Installazione e avvio
```bash
git clone <https://github.com/manumarra/PWM>
cd <cartella-del-repository>
npm install
cp .env.example .env     # poi compila .env (vedi sotto)
npm run dev              # sviluppo, con riavvio automatico
# oppure
npm start                # avvio normale
```
Il sito è su **http://localhost:3000**. Al primo avvio il catalogo dei piatti viene caricato da `meals.json`
nel database (le volte successive il caricamento viene saltato).

## Configurazione (`.env`)

| Variabile | Obbligatoria | Descrizione |
|---|---|---|
| `MONGODB_URI` | sì | Indirizzo del database MongoDB, con il nome del database |
| `JWT_SECRET` | sì | Segreto per firmare i token di sessione (stringa lunga e casuale) |
| `PORT` | no | Porta del server (default 3000) |
| `APP_URL` | no | Indirizzo pubblico dell'app, usato da Stripe per il ritorno al sito |
| `STRIPE_SECRET_KEY` | no | Chiave segreta di **prova** (`sk_test_...`). Vuota = pagamenti simulati |
| `STRIPE_WEBHOOK_SECRET` | no | Segreto del webhook (`whsec_...`), solo se si usa la Stripe CLI |
| `NODE_ENV` | no | `production` solo se il sito è servito in HTTPS |

## Pagamenti: Stripe oppure simulati
- **Senza `STRIPE_SECRET_KEY`** i pagamenti sono **simulati**: l'ordine nasce già pagato e il cliente sceglie
  solo fra carta di credito e prepagata. Non servono account né connessione. All'avvio il server scrive
  `Pagamenti: simulati`.
- **Con una chiave di prova** il cliente viene portato alla pagina di pagamento di Stripe. Si può pagare con la
  carta di prova `4242 4242 4242 4242`, una scadenza futura e un CVC qualsiasi.
- L'ordine viene creato **prima** del pagamento ed è visibile al ristoratore solo dopo averlo ricevuto. Un ordine
  non pagato entro circa 35 minuti scade; fino ad allora il cliente può riprendere il pagamento dallo storico.
- Il **webhook** è facoltativo: il pagamento si conferma comunque quando il cliente torna al sito. Per attivarlo:
  ```bash
  stripe listen --forward-to localhost:3000/api/payments/webhook
  ```
  e copia il `whsec_...` stampato in `STRIPE_WEBHOOK_SECRET`.
- I dati della carta non passano mai da questa applicazione.

## Documentazione delle API
Con il server avviato, la documentazione interattiva (Swagger UI) è su **http://localhost:3000/api-docs**.
La specifica è nel file `src/docs/openapi.yaml` (e in forma grezza su `/api-docs.json`).

Per provare le operazioni protette: esegui **POST /users/login** dalla pagina e poi le altre operazioni; il
browser invia da solo il cookie di sessione.

Per verificare che la documentazione sia coerente con le route del codice:
```bash
npm run docs:check
```

## Come provarlo in pochi minuti
1. **Ristoratore**: registrati come ristoratore (partita IVA di 11 cifre e un indirizzo reale), apri il
   **Catalogo**, aggiungi qualche piatto al menu e controlla nel **Menù** che siano **disponibili**.
2. **Cliente**: in una finestra anonima registrati come cliente, cerca un ristorante o un piatto (**Piatti**),
   aggiungi al carrello e conferma l'ordine.
3. **Ristoratore**: nella pagina **Ordini** compare l'ordine (con avviso e pallino rosso). Fallo avanzare di
   stato; per consegnarlo serve il **codice** che il cliente vede nel suo storico.
4. Guarda le **Statistiche** del ristorante.

La consegna a domicilio richiede l'accesso a Internet (OpenStreetMap) e un indirizzo che esista davvero;
il ritiro in locale funziona anche offline.

## Struttura del progetto
```
.
├── meals.json              Catalogo comune dei piatti, caricato all'avvio
├── scripts/
│   └── check-swagger.mjs   Controllo di coerenza tra documentazione e route
└── src/
    ├── app.js              Avvio del server e montaggio delle route
    ├── config/             Connessione a MongoDB e caricamento iniziale dei dati
    ├── docs/openapi.yaml   Specifica OpenAPI (Swagger)
    ├── middleware/         Autenticazione, ruoli, gestione degli errori
    ├── models/             Schemi Mongoose (utenti cliente/ristoratore, piatti, ordini)
    ├── repositories/       Accesso ai dati e regole di business
    ├── routes/             Endpoint REST
    ├── services/           Integrazioni esterne (Stripe, OpenStreetMap)
    ├── utils/              Funzioni di utilità (allergeni, ricerche, ...)
    └── public/             Frontend: pagine, componenti, servizi, stili
```

## Scelte principali
- **Prezzi, costo di consegna, totale e tempo di attesa sono calcolati dal server**: il browser invia solo i
  piatti scelti e le quantità, quindi non può alterare gli importi.
- **Autenticazione con JWT in cookie httpOnly** (non leggibile da JavaScript, `SameSite=Strict`); ruoli e
  proprietà delle risorse sono controllati sempre sul server.
- **Allergeni** dedotti dagli ingredienti con un dizionario di parole chiave: sono **indicativi**.
- Le notifiche al ristoratore funzionano con **interrogazioni periodiche** (ogni 15 secondi).
- Il percorso di consegna usa la distanza stradale (OSRM); se il servizio non risponde si usa la distanza in
  linea d'aria e il cliente ne viene avvisato.
- **Codice di consegna**: generato in modo casuale, visibile solo al cliente e mai restituito al ristoratore;
  dopo 5 tentativi errati l'ordine resta bloccato per 15 minuti.

## Limiti noti
- Non sono previsti **rimborsi** (lo stato esiste, ma nessuna funzione lo usa).
- Il pagamento è solo in **modalità di prova**; nessun addebito reale.
- Geocoding e percorsi dipendono da servizi pubblici gratuiti, con limiti di utilizzo.