# 🚀 Deploy BeatDraft Backend su GitHub + Render

## Setup GitHub Repository

### 1. Crea repository su GitHub

```bash
# Dal tuo terminale, nella cartella beatdraft-backend:

git init
git add .
git commit -m "Initial commit - BeatDraft backend"

# Crea repository su GitHub (https://github.com/new)
# Poi connetti:

git remote add origin https://github.com/TUO_USERNAME/beatdraft-backend.git
git branch -M main
git push -u origin main
```

### 2. Struttura Repository

```
beatdraft-backend/
├── config/
├── routes/
├── services/
├── scripts/
├── server.js
├── package.json
├── .env.example       ← Incluso (template)
├── .env               ← NON includere (in .gitignore)
├── .gitignore
└── README.md
```

---

## Deploy su Render (Free Tier)

### 1. Crea account Render
- Vai su https://render.com
- Sign up con GitHub

### 2. Crea PostgreSQL Database

1. Dashboard → New → PostgreSQL
2. Name: `beatdraft-db`
3. Database: `beatdraft`
4. User: (auto-generato)
5. Region: Frankfurt (EU)
6. Instance Type: **Free**
7. Create Database

**Salva questi valori:**
- Internal Database URL (per il backend)
- External Database URL (per connessione locale)

### 3. Crea Web Service

1. Dashboard → New → Web Service
2. Connect Repository: `beatdraft-backend`
3. Configurazione:

**Basic:**
- Name: `beatdraft-api`
- Region: Frankfurt
- Branch: `main`
- Root Directory: (vuoto se backend è nella root)
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Instance Type: **Free**

**Environment Variables:**

Aggiungi queste variabili (Settings → Environment):

```
SPOTIFY_CLIENT_ID=tuo_client_id
SPOTIFY_CLIENT_SECRET=tuo_client_secret
DATABASE_URL=[Internal Database URL da Render]
JWT_SECRET=genera_stringa_random_lunga
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://tuonome.github.io
```

**Come generare JWT_SECRET:**
```bash
# Su Mac/Linux:
openssl rand -base64 32

# O usa un sito:
https://www.random.org/strings/
```

4. Click **Create Web Service**

### 4. Inizializza Database

Dopo il primo deploy:

1. Render Dashboard → `beatdraft-api` → Shell (tab in alto)
2. Esegui:

```bash
npm run init-db
```

3. Poi sincronizza Spotify:

```bash
npm run sync
```

### 5. Verifica

Il tuo API sarà live su:
```
https://beatdraft-api.onrender.com
```

Test:
```bash
curl https://beatdraft-api.onrender.com/health
```

---

## Connetti Frontend al Backend

Modifica il frontend (`beatdraft-v4.html`):

```javascript
// Aggiungi all'inizio dello script:
const API_URL = 'https://beatdraft-api.onrender.com';

// Esempio fetch artisti:
async function loadArtists() {
  const response = await fetch(`${API_URL}/api/artists`);
  const data = await response.json();
  console.log('Artists:', data.artists);
}
```

---

## Update Backend

Per aggiornare il backend:

```bash
# Fai modifiche al codice
git add .
git commit -m "Update: descrizione modifiche"
git push origin main
```

Render rileverà automaticamente il push e rideploya.

---

## Debug su Render

**Logs in tempo reale:**
1. Dashboard → `beatdraft-api`
2. Tab "Logs"
3. Vedi output console in tempo reale

**Shell interattiva:**
1. Dashboard → `beatdraft-api`
2. Tab "Shell"
3. Esegui comandi Node.js

```bash
# Esempi:
node
> const db = require('./config/database')
> db.query('SELECT COUNT(*) FROM artists').then(r => console.log(r.rows))
```

---

## Database Management

**Connessione locale al DB di produzione:**

```bash
# Usa External Database URL da Render
psql [EXTERNAL_DATABASE_URL]
```

**Backup database:**

```bash
pg_dump [EXTERNAL_DATABASE_URL] > backup.sql
```

**Restore:**

```bash
psql [EXTERNAL_DATABASE_URL] < backup.sql
```

---

## Monitoring

**Health checks:**
Render monitora automaticamente `/health`

**Custom monitoring:**
- Aggiungi Sentry per error tracking
- Usa Render Metrics (nella dashboard)

---

## Costi

**Free Tier Render:**
- ✅ 750 ore/mese web service
- ✅ PostgreSQL 1GB storage
- ⚠️ Il servizio "dorme" dopo 15 min di inattività
- ⚠️ Primo request dopo "sleep" è lento (~30sec)

**Per evitare sleep:**
- Upgrade a Paid ($7/mese)
- Oppure usa cron-job.org per ping ogni 10 min

---

## Troubleshooting

**"Application failed to respond"**
- Verifica che PORT sia 3000 nel codice
- Controlla logs per errori

**"Database connection error"**
- Verifica DATABASE_URL nelle env variables
- Controlla che il database sia attivo

**"Spotify API error"**
- Verifica SPOTIFY_CLIENT_ID e SECRET
- Controlla su Spotify Dashboard che le credenziali siano corrette

---

## Sicurezza

✅ **GIÀ IMPLEMENTATO:**
- Password hashate (bcrypt)
- JWT per auth
- Parametrized SQL queries
- CORS configurato

⚠️ **DA AGGIUNGERE (produzione):**
- Rate limiting
- Helmet.js per security headers
- HTTPS only
- Input validation (express-validator)

---

## Alternative Deploy

**Railway:**
- Simile a Render
- https://railway.app
- Free tier: $5 crediti/mese

**Fly.io:**
- Più tecnico
- https://fly.io
- Free tier disponibile

**Heroku:**
- Classico ma più costoso
- Free tier terminato

---

## Next Steps

1. ✅ Deploy backend su Render
2. ✅ Connetti database
3. ⏭️ Collega frontend al backend
4. ⏭️ Implementa auth nel frontend
5. ⏭️ Aggiungi features (marketplace, competitions)

---

**Domande?** Apri issue su GitHub!
