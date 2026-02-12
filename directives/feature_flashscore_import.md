# Direttiva: Importazione Dati da Flashscore

**Obiettivo:** Permettere all'utente di selezionare una partita recente (ultimi 7 giorni) da Flashscore e compilare automaticamente i campi di `FullTimeEditor.js`.

## 1. Analisi e Setup Strumenti (Livello Execution)
- **Tool Esterno:** Dobbiamo integrare la logica di `https://github.com/gustavofariaa/FlashscoreScraping`.
- **Azione:** Clona questo repo in una cartella temporanea `.tmp/scraper_reference` per analizzarne il funzionamento, poi crea uno script Python ottimizzato in `execution/scrape_flashscore.py`.
- **Requisiti Script Python:**
  - Deve accettare argomenti: `country`, `league`, `days_back`.
  - Deve restituire un JSON pulito con: SquadraCasa, SquadraOspite, Risultato, Marcatori (con minuto).
  - Deve gestire errori (es. partita non trovata o CSS selector cambiati).

## 2. Backend / API Layer (Livello Orchestration)
- Poiché il frontend (React) non può lanciare script Python arbitrari direttamente, crea un endpoint API (su Next.js API Routes o FastAPI, a seconda di cosa è attivo) che funge da ponte.
- L'endpoint `/api/get-matches` riceve la richiesta dal frontend, esegue `execution/scrape_flashscore.py` e restituisce i dati al client.

## 3. Frontend Implementation (Livello UI)
- Modifica `frontend/src/FullTimeEditor.js` (o crea un componente `FlashscoreSelector.js`).
- **UI:** Aggiungi un pannello "Importa da Flashscore" con:
  1. Dropdown Competizione (es. Grecia Super League, Champions League).
  2. Bottone "Cerca Partite".
  3. Lista risultati (ultimi 7 giorni).
  4. Al click su una partita, popola i seguenti state/input:
     - `homeTeamName`, `awayTeamName`
     - `homeScore`, `awayScore`
     - `scorers` (lista marcatori).

## 4. Vincoli e Gestione Errori
- Lo scraping è lento: mostra uno spinner di caricamento (Loading State) nel frontend mentre Python lavora.
- Se lo scraper fallisce, mostra un messaggio "Impossibile recuperare i dati, inserire manualmente".
