# Direttiva: Deploy in Produzione (Sistema Ferrari)

**Obiettivo:** Pubblicare le modifiche su GitHub per scatenare il deploy automatico su Vercel.

## 1. Controllo Pre-Flight (Critico)
- Leggi il file `src/pocketbase.js` (o dove è configurato il client PocketBase).
- **Verifica:** L'URL di connessione DEVE contenere "pockethost.io".
- **Errore:** Se trovi "127.0.0.1" o "localhost", BLOCCA tutto e chiedi all'utente l'URL di produzione corretta, oppure sostituiscilo se l'utente te lo fornisce. Non procedere al commit se l'URL è locale.

## 2. Spedizione su GitHub (Il Telecomando)
Esegui questi comandi nel terminale, uno dopo l'altro:
1. `git add .`
2. `git commit -m "Update: Deploy di produzione"` (chiedi all'utente se vuole un messaggio diverso, altrimenti usa questo standard).
3. `git push`

## 3. Verifica Post-Deploy
- Avvisa l'utente che il codice è su GitHub.
- Ricorda all'utente di controllare la dashboard di Vercel se è il primo deploy, o di attendere 1 minuto per l'aggiornamento automatico.