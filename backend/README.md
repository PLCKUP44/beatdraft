# 🎵 BeatDraft Backend

Backend API per BeatDraft - Fantasy Music Platform con integrazione Spotify.

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+ 
- PostgreSQL 14+
- Account Spotify Developer

### 1. Setup Spotify API

1. Vai su https://developer.spotify.com/dashboard
2. Crea una nuova app
3. Copia `Client ID` e `Client Secret`

### 2. Setup Database

```bash
# Installa PostgreSQL (se non ce l'hai)
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Crea database
createdb beatdraft

# O con psql
psql -U postgres
CREATE DATABASE beatdraft;
\q
```

### 3. Installa dipendenze

```bash
npm install
```

### 4. Configura environment

```bash
# Copia .env.example
cp .env.example .env

# Modifica .env con i tuoi valori
nano .env
```

Compila:
```env
SPOTIFY_CLIENT_ID=il_tuo_client_id
SPOTIFY_CLIENT_SECRET=il_tuo_client_secret
DATABASE_URL=postgresql://localhost:5432/beatdraft
JWT_SECRET=una_stringa_random_super_segreta
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

### 5. Inizializza database

```bash
# Crea le tabelle
psql -d beatdraft -f scripts/schema.sql

# O con script Node.js
npm run init-db
```

### 6. Avvia il server

```bash
# Development (con auto-reload)
npm run dev

# Production
npm start
```

Il server parte su: http://localhost:3000

---

## 📡 API Endpoints

### Artists

**GET** `/api/artists`
```bash
# Lista tutti gli artisti
curl http://localhost:3000/api/artists

# Filtra per categoria
curl http://localhost:3000/api/artists?category=Mondiale&limit=20
```

**GET** `/api/artists/:id`
```bash
# Dettaglio artista con storico
curl http://localhost:3000/api/artists/1
```

**POST** `/api/artists/sync/:spotifyId`
```bash
# Forza sync di un artista
curl -X POST http://localhost:3000/api/artists/sync/06HL4z0CvFAxyc27GXpf02
```

### Charts

**GET** `/api/charts`
```bash
# Charts Italia
curl http://localhost:3000/api/charts?region=it

# Charts Globali
curl http://localhost:3000/api/charts?region=global
```

### Users

**POST** `/api/users/register`
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","email":"player@example.com","password":"password123"}'
```

**POST** `/api/users/login`
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"player@example.com","password":"password123"}'
```

**GET** `/api/users/me`
```bash
# Richiede auth header
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Competitions

**GET** `/api/competitions`
```bash
curl http://localhost:3000/api/competitions
```

**GET** `/api/competitions/:id`
```bash
curl http://localhost:3000/api/competitions/1
```

**POST** `/api/competitions/:id/join`
```bash
curl -X POST http://localhost:3000/api/competitions/1/join \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Lineup

**GET** `/api/lineup/:competitionId`
```bash
curl http://localhost:3000/api/lineup/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**POST** `/api/lineup/:competitionId`
```bash
curl -X POST http://localhost:3000/api/lineup/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cardId":5,"slotCategory":"Mondiale"}'
```

---

## 🗄️ Database Schema

- **users** - Utenti registrati
- **artists** - Artisti con dati Spotify
- **artist_stats_history** - Storico per calcolare growth
- **user_cards** - Carte possedute dagli utenti
- **competitions** - Competizioni attive
- **competition_participants** - Iscrizioni
- **lineup_cards** - Lineup delle competizioni

---

## 🔄 Sync Automatico

Il server sincronizza automaticamente i dati Spotify:
- **Cron job**: Ogni giorno alle 3:00 AM
- **Manuale**: `npm run sync`

---

## 🚢 Deploy su Render/Railway

### Render (Consigliato)

1. Crea account su https://render.com
2. New → Web Service
3. Connetti GitHub repository
4. Configurazione:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: aggiungi variabili da `.env`
5. Crea PostgreSQL database (interno)
6. Connetti database al web service

### Railway

1. Crea account su https://railway.app
2. New Project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Aggiungi variabili environment
5. Deploy automatico

---

## 🛠️ Scripts

```bash
npm start        # Avvia server production
npm run dev      # Avvia con nodemon (auto-reload)
npm run sync     # Sync manuale Spotify
npm run init-db  # Inizializza database
```

---

## 📁 Struttura Progetto

```
beatdraft-backend/
├── config/
│   └── database.js       # Configurazione PostgreSQL
├── routes/
│   ├── artists.js        # API artisti
│   ├── charts.js         # API charts
│   ├── users.js          # Auth e users
│   ├── competitions.js   # API competizioni
│   └── lineup.js         # API lineup
├── services/
│   └── spotifyService.js # Integrazione Spotify API
├── scripts/
│   ├── schema.sql        # Schema database
│   ├── initDatabase.js   # Init script
│   └── syncSpotify.js    # Sync script
├── server.js             # Entry point
├── package.json
├── .env.example
└── README.md
```

---

## 🔐 Security

- Password hashate con bcrypt
- JWT per autenticazione
- CORS configurato
- SQL injection prevention (parametrized queries)
- Rate limiting TODO (aggiungi express-rate-limit)

---

## 📊 Monitoring

```bash
# Health check
curl http://localhost:3000/health

# Output: {"status":"ok","timestamp":"2026-02-18T..."}
```

---

## 🐛 Troubleshooting

**Database connection error**
```bash
# Verifica che PostgreSQL sia attivo
pg_isready

# Verifica credenziali
psql -d beatdraft
```

**Spotify API error**
```bash
# Verifica credenziali
echo $SPOTIFY_CLIENT_ID
echo $SPOTIFY_CLIENT_SECRET

# Test token
curl -X POST "https://accounts.spotify.com/api/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_ID&client_secret=YOUR_SECRET"
```

---

## 📝 TODO

- [ ] Rate limiting
- [ ] Redis per caching
- [ ] WebSocket per updates real-time
- [ ] Background jobs con Bull/Queue
- [ ] Tests (Jest)
- [ ] API documentation (Swagger)
- [ ] Marketplace secondario
- [ ] Friend system
- [ ] Notifications

---

## 📄 License

MIT
