# Deploy Backend su Render.com

## Panoramica
Il backend (Express + Puppeteer) va deployato su Render.com (piano gratuito) per rendere gli endpoint API accessibili dal frontend su Firebase Hosting.

## File Creati
- `Dockerfile` — Container Docker con Node 18 + Chromium di sistema
- `backend-package.json` — Dipendenze solo backend (leggero, no React)

## Passi di Deploy

### 1. Push su GitHub
Assicurati che tutto il codice sia committato e pushato su GitHub.

### 2. Crea Account Render
Vai su [render.com](https://render.com) e registrati (puoi usare il login GitHub).

### 3. Crea Web Service
1. Dashboard → **New** → **Web Service**
2. Collega il tuo repository GitHub `cronacheapp`
3. Configura:
   - **Name**: `cronacheapp-backend`
   - **Region**: Frankfurt (EU) — più vicino alla Grecia
   - **Runtime**: **Docker**
   - **Instance Type**: **Free**
4. **Nessuna variabile d'ambiente necessaria** (il Dockerfile configura tutto)
5. Clicca **Create Web Service**

### 4. Attendi il Deploy
Il primo build richiede ~5 minuti. Quando è "Live", avrai un URL tipo:
```
https://cronacheapp-backend.onrender.com
```

### 5. Aggiorna config.js
Sostituisci l'URL di produzione in `src/config.js`:
```javascript
API_BASE_URL: window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://cronacheapp-backend.onrender.com'  // ← il TUO URL Render
```

### 6. Rideploya il Frontend
```bash
npm run build
firebase deploy
```

## Note Importanti

- **Cold Start**: Il piano gratuito spegne il server dopo 15 min di inattività. Prima richiesta: ~30-60 sec di avvio + ~10-15 sec scraping = ~40-75 sec totali.
- **Limiti piano gratuito**: 512MB RAM, 750 ore/mese. Puppeteer usa ~200-300MB. Le 750 ore coprono tutto il mese per un utente singolo.
