# CronacheApp

Editor di grafiche per il calcio greco: risultati, notizie, classifiche, formazioni, convocati, giocatori e riepiloghi dei campionati.

## Stack effettivo

- `client/`: React 19, React Router, Create React App, Konva e html-to-image.
- `server/`: Express, Axios, scraping Flashscore via HTTP con fallback Chromium/Puppeteer.
- Frontend: [Firebase Hosting](https://cronacheapp.web.app).
- Backend: [Render](https://cronacheapp.onrender.com/api/health-check).
- Le configurazioni Firebase Functions in `functions/` sono storiche e non fanno parte del deploy attivo. Nessun database è attualmente necessario al flusso degli editor.

## Avvio

Richiede Node.js 22 o successivo e npm.

```sh
npm ci
npm run dev
```

Il frontend usa la porta 3000, il backend la 5000. Per il fallback browser locale, se Chromium non è già disponibile:

```sh
npm run browser:install --prefix server
```

Per installare senza scaricare Chromium, impostare `PUPPETEER_SKIP_DOWNLOAD=true`. Copiare gli esempi `.env.example` solo se servono personalizzazioni: gli editor e Flashscore funzionano senza chiavi private. Il generatore di bio richiede `GITHUB_TOKEN` sul backend. Le variabili `REACT_APP_*` sono pubbliche: non inserirvi segreti.

## Verifica

```sh
npm test
npm run build
```

`prebuild` e `prestart` copiano il runtime MediaPipe installato in `client/public/vendor/mediapipe/`. Non modificare o committare questa cartella generata.

## Loghi dei calciatori in Grafiche → Squad

Nel JSON importato, ogni calciatore può avere un proprio logo squadra nel campo `logo`:

```json
{
  "sections": {
    "gk": [{ "name": "NOME PORTIERE", "stars": 3, "logo": "/loghi/SuperLeague/paok.png" }],
    "def": [{ "name": "NOME DIFENSORE", "stars": 4, "logo": "https://example.com/logo-club.png" }],
    "mid": [],
    "att": []
  }
}
```

Sono supportati URL HTTP/HTTPS, percorsi delle immagini dell'app e immagini incorporate come `data:image/...;base64,...`. Un percorso sul computer non carica il file: usare il pulsante **Logo Club** per incorporarlo, poi **Scarica template** per salvarlo nel JSON. Il campo vuoto o assente lascia il calciatore senza logo. Sono accettati anche `teamLogo`, `logoUrl`, `teamLogoUrl` e le varianti `team_logo`, `logo_url`, `team_logo_url`; `logo` ha precedenza se non vuoto. Il template scaricato include sempre il campo `logo` per ogni calciatore.

I loghi dei fornitori supportati, come TheSportsDB e Flashscore, passano dal proxy immagini dell'app. Per gli altri URL il server dell'immagine deve consentire l'accesso CORS per l'esportazione della grafica; in alternativa incorporare il logo come Base64 tramite **Logo Club**.

## Pubblicazione

Il push su `main` avvia test, build con lint e deploy Firebase tramite GitHub Actions. Render deve avere l'auto-deploy attivo sullo stesso branch; l'immagine viene costruita dal `Dockerfile` nella radice. Per identificare il codice del backend leggere `revision` in `/api/health-check` e confrontarlo con il commit GitHub.

Istruzioni operative: [deploy](directives/deploy_production.md). Analisi dettagliata, problemi corretti, misurazioni e roadmap: [audit del 5 novembre 2026](docs/ANALISI_TECNICA_2026-11-05.md).
