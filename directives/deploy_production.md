# Deploy di produzione — Firebase Hosting e Render

Aggiornato il 5 novembre 2026. Questa direttiva sostituisce il precedente flusso Vercel/PocketBase, non utilizzato dal progetto attivo.

## Verifica prima del rilascio

1. Esaminare `git status` e preservare modifiche/file locali preesistenti; aggiungere al commit soltanto i file del lavoro.
2. Verificare `client/src/config.js`: in produzione deve usare `https://cronacheapp.onrender.com` o un override `REACT_APP_API_BASE_URL` intenzionale. Il loopback deve essere limitato allo sviluppo.
3. Eseguire `npm test` e `npm run build` con CI attiva. Non disattivare lint o controlli per pubblicare.
4. Non committare `.env`, credenziali, service account, build o temporanei. PocketBase non è una dipendenza del flusso attuale.

## Pubblicazione

Push sul branch `main` del repository `Zefkilis2002/cronacheapp`. Il workflow `.github/workflows/firebase-hosting-merge.yml` installa da lockfile, verifica il progetto e pubblica `client/build` su Firebase Hosting.

Il backend Render usa il `Dockerfile` nella radice e deve avere l'auto-deploy dal medesimo branch attivo. Le dipendenze sono in `server/package-lock.json`; Chromium di sistema è indicato da `PUPPETEER_EXECUTABLE_PATH`. `functions/` è codice storico e non va incluso nel rilascio corrente.

## Verifica dopo il push

1. Attendere l'esito del workflow GitHub Actions del commit pubblicato.
2. Verificare la nuova build su `https://cronacheapp.web.app`.
3. Leggere `https://cronacheapp.onrender.com/api/health-check`: `revision` deve corrispondere al commit, non soltanto rispondere HTTP 200.
4. Provare ricerca Roma, lista partite e proxy dei due loghi. Verificare CORS per l'export.
5. Se uno dei due deploy non riesce, riportare servizio, commit, errore e stato reale. Un push riuscito non dimostra che il deploy sia riuscito.

Per il rollback usare un revert del commit e lo stesso flusso, preservando la cronologia.
