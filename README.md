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

## Pubblicazione

Il push su `main` avvia test, build con lint e deploy Firebase tramite GitHub Actions. Render deve avere l'auto-deploy attivo sullo stesso branch; l'immagine viene costruita dal `Dockerfile` nella radice. Per identificare il codice del backend leggere `revision` in `/api/health-check` e confrontarlo con il commit GitHub.

Istruzioni operative: [deploy](directives/deploy_production.md). Analisi dettagliata, problemi corretti, misurazioni e roadmap: [audit del 5 novembre 2026](docs/ANALISI_TECNICA_2026-11-05.md).
