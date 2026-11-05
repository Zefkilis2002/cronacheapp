# Analisi tecnica di CronacheApp — 5 novembre 2026

## Perimetro e metodo

Analisi del checkout `main` inizialmente al commit `e539359`, con lettura dei flussi client/server, configurazioni di build e deploy, integrazioni esterne, gestione dello stato, caricamento degli asset ed esportazione. Verifiche mediante test automatici, build di produzione con CI attiva, richieste HTTP ai servizi reali e controlli del frontend nel browser.

Le misurazioni locali non sono una garanzia sui tempi di Render: rete, disponibilità dei provider e cold start incidono sul tempo reale. Le funzionalità che richiedono chiavi private o dispositivi fisici sono indicate esplicitamente fra i limiti della verifica.

## 1. Architettura reale

Il progetto è un'applicazione React 19 compilata da Create React App 5, con API Express separate. Non è un'app Next.js/FastAPI: la documentazione precedente descriveva uno stack diverso da quello eseguibile.

| Area | Responsabilità | Osservazione |
|---|---|---|
| `client/src/App.js` | Routing degli editor | Ora carica le pagine con `React.lazy` e `Suspense` |
| `FullTimeEditor`, `useFullTimeState` | Risultato, rigori, marcatori e loghi | Stato centralizzato; aggiornamenti asincroni ora parziali |
| `FlashscoreImport` | Ricerca partite e import | Usa gli stemmi del feed e separa arricchimento e risultato |
| `LogoFetcher` | Ricerca interattiva per più editor | Catalogo locale immediato, debounce remoto e cache condivisa |
| `ClassificaComp` | Tabelle e varianti grafiche | Bundle condiviso e ricerca dei loghi mancanti |
| `StartingXI` | Formazioni ufficiali e colori maglie | Importazioni concorrenti, controllo della selezione dopo ogni attesa |
| `NewsEditor`, hook canvas/testo | Composizione di notizie e immagini | Konva, testo formattato, filtri locali |
| `BioCreator` | OCR e generazione testo | Tesseract sul client, generazione sul server |
| Altri editor grafici | Convocati, giocatori, campionati, formazioni | Rendering DOM ed esportazione con html-to-image |
| `server/execution/scrape_flashscore.js` | Feed e fallback browser | HTTP primario; ora capacità browser riservata atomicamente |
| `server/execution/instagram.js` | Media pubblici Instagram | Embed HTTP con fallback browser; dipende da markup esterno |
| `server/lib/` | Cache, ricerca loghi, URL e concorrenza | Logica estratta e testabile separatamente |
| Firebase Hosting / Render | Pubblicazione frontend / backend | Due deploy distinti da verificare sullo stesso commit |

PocketBase e Firebase SDK non erano importati dai flussi attivi. I relativi moduli client, il vecchio script database e le dipendenze inutilizzate sono stati rimossi. `functions/` contiene ancora codice storico, incluso un riferimento a uno scraper in un percorso inesistente: non va distribuito come backend alternativo senza un lavoro dedicato.

## 2. Cause dei due problemi segnalati

### Ricerca «Cerca Web»

L'endpoint chiamava `/api/v1/json/3/searchteams.php`. Verifica riproducibile con `Roma`: il provider rispondeva HTTP 403; il server trasformava l'errore in un array vuoto e lo metteva in cache. L'interfaccia comunicava quindi «nessun logo» anche quando il servizio non aveva realmente eseguito la ricerca.

La chiave pubblica documentata oggi è `123`: la medesima ricerca ha restituito HTTP 200 e lo stemma della Roma. È ora il valore predefinito, con possibilità di usare `THESPORTSDB_API_KEY` sul server. Errori di rete, timeout e rate limit non vengono salvati come ricerche vuote riuscite. Il frontend distingue gli errori dai risultati assenti e conserva i risultati locali.

Riferimento primario: [TheSportsDB, Free API quickstart](https://www.thesportsdb.com/free_sports_api). Il limite dichiarato della chiave condivisa è 30 richieste/minuto: debounce, cache, deduplicazione e uso diretto dei loghi Flashscore riducono le chiamate, ma non eliminano il limite del fornitore.

### Loghi dopo l'importazione Flashscore

Il feed risultati contiene `OA` e `OB`, rispettivamente gli asset delle squadre di casa e ospite. Il parser precedente li scartava. Il client doveva quindi indovinare il logo dal nome o dipendere dalla ricerca web non funzionante. Se non trovava nulla, conservava gli stemmi della partita precedente.

Ora il parser restituisce `homeLogo` e `awayLogo`, normalizza gli asset verso il CDN Flashscore e li conserva anche nell'elenco delle partite per le formazioni. Il client applica subito il logo locale esatto o quello del feed; la ricerca è un fallback per dati che non contengono lo stemma. In mancanza di un logo vengono rimossi quelli precedenti, evitando un'identità visiva errata.

Il proxy consente i CDN effettivi di Flashscore e TheSportsDB, applica CORS, timeout, verifica del tipo immagine e controllo dei redirect. Gli stemmi restano esportabili nel canvas.

## 3. Altri difetti corretti

| Problema osservato nel codice | Conseguenza | Correzione |
|---|---|---|
| Ora delle partite formattata nel fuso del server | In produzione l'orario differiva di un'ora dal locale, o due in estate | Formattazione esplicita `Europe/Rome`, con test inverno/estate |
| Scelta dal menu dopo upload/ricerca | Lo stemma caricato continuava a prevalere | Azzeramento di `uploadedLogo` scegliendo il logo locale |
| Import senza logo | Restava il logo della partita precedente | Reset esplicito e sorgente canvas opzionale |
| Aggiornamenti asincroni completi | Marcatori o loghi potevano ripristinare punteggi già modificati | Aggiornamenti parziali in `useFullTimeState` |
| Risposte di una selezione vecchia | Dati di partite diverse nella stessa grafica | Controllo di identità della richiesta e annullamento del consumatore |
| Cambio competizione con risultati vecchi | Import nel template di un'altra competizione | Pulizia di elenco e selezione al cambio |
| Ricerca loghi duplicata in più moduli | Richieste ripetute e comportamenti divergenti | Servizi client comuni per ricerca e URL canvas |
| Cache negativa senza scadenza nella classifica | Timeout iniziale poteva impedire altri tentativi per tutta la sessione | Rimosso il modulo separato; errori non memorizzati e cache con scadenza |
| Risposte vecchie nella ricerca interattiva | Suggerimenti fuori ordine e spinner incoerenti | Controllo del controller attuale e pulizia dei timer |
| Match parziale dei nomi | Possibili stemmi greci assegnati a club esteri o omonimi | Indice normalizzato con corrispondenza esatta e suffisso nazione |
| URL assoluti concatenati all'origine | URL di caricamento non validi | Sorgenti logo usate direttamente |
| Bio diretta a `localhost:5000` | Generatore inutilizzabile dal sito pubblico | Uso di `config.API_BASE_URL` |
| Configurazione API duplicata | Comportamenti diversi fra pagine e hostname locali | Configurazione comune, supporto loopback e override di build |
| Timeout classifiche di 4 secondi | Cold start interpretato come assenza di dati | Tempo compatibile con Render, dati precedenti conservati durante il caricamento |
| Aggiornamento classifica dopo cambio variante | Possibile sovrascrittura con la variante selezionata prima della richiesta | Applicazione del bundle attraverso lo stato e la variante corrente |
| Import Starting XI sequenziale | Attesa duplicata per estrarre i colori delle squadre | Elaborazioni parallele e verifica della richiesta dopo il caricamento immagini |
| Immagine colori senza timeout | Import potenzialmente sospeso | Timeout con fallback al kit predefinito |
| Cache server: solo refresh deduplicati | Richieste iniziali contemporanee avviavano più scraping | Condivisione delle richieste anche a cache fredda |
| Limite pagine browser non atomico | Più richieste potevano superare il limite e aumentare la RAM | Semaforo FIFO con due slot, rilascio idempotente e coda a scadenza |
| Chromium avviato sempre | Memoria usata anche per ricerche che richiedono solo HTTP | Avvio su richiesta; preriscaldamento facoltativo |
| Fallback dettagli con solo matchId | Navigazione Puppeteer senza URL | URL derivato dall'ID quando necessario |
| Fallimento dettagli presentato come partita senza marcatori | Risposta vuota salvata come valida | Errore esplicito, tentativi successivi consentiti |
| Export Konva interrotto da un errore | Scala, dimensioni o bordo dell'anteprima non ripristinati | `exportStage` condiviso con ripristino in `finally` |
| Listener orientationchange diverso in cleanup | Listener accumulati ai remount | Stesso handler per aggiunta e rimozione |
| Keep-alive senza cleanup | Timer/listener residui con remount | Funzione di arresto restituita all'effetto React |
| MediaPipe: avvisi webpack e source map assente | Build CI fallita o controlli disattivati | Runtime ESM/WASM locale della versione installata, copiato da prebuild |
| Singleton MediaPipe fallito conservato | Un errore iniziale impediva i nuovi tentativi | Promise azzerata in caso di errore |
| Test iniziale «learn react» | Nessuna verifica del prodotto reale | Suite di regressione per routing, ricerche, import, cache, proxy ed export |
| Deploy con lint disattivato | Errori e avvisi nascosti dalla pipeline | Test obbligatori e build CI con lint attivo |
| Docker install non deterministico e moduli non copiati | Deploy non riproducibile o backend privo dei nuovi helper | `npm ci`, Node 22, copia di `server/lib`, esclusione di segreti dal contesto |

## 4. Prestazioni: interventi e misure

Le ottimizzazioni riducono lavoro e round trip, senza basarsi sull'aumento indiscriminato dei timeout:

1. Suggerimenti del catalogo locale nel medesimo aggiornamento di input, senza rete.
2. Debounce remoto da 300 a 220 ms; cancellazione delle sottoscrizioni superate.
3. Cache client limitata a 250 voci e con scadenza, condivisa fra ricerca, import e classifiche.
4. Richieste concorrenti alla stessa risorsa condivise; un consumatore annullato non interrompe gli altri.
5. Cache server con risposta immediata dei dati ancora utilizzabili e aggiornamento in background.
6. Stemmi Flashscore ottenuti insieme al risultato, senza due ricerche aggiuntive.
7. Competizioni principali restituite dal catalogo senza attendere la lista remota delle divisioni minori.
8. Caricamento degli editor su richiesta: OCR, filtri e pagine non usate non devono essere scaricati all'avvio.
9. Runtime MediaPipe e WASM serviti da Firebase insieme alla build, evitando divergenze con una versione CDN diversa.

Misurazione sul backend locale, provider reali, 5 novembre 2026. Singola esecuzione, non benchmark statistico:

| Operazione | Prima richiesta | Ripetizione dalla cache |
|---|---:|---:|
| Logo Roma | 148 ms | 3 ms |
| Logo PAOK da catalogo | 5 ms | — |
| Competizioni Italia da catalogo | 4 ms | — |
| Partite Grecia, ultimi 14 giorni | 1.005 ms | 2 ms |
| Marcatori di Kalamata–Iraklis | 202 ms | — |
| Proxy stemma Roma | 118 ms | cache HTTP successiva disponibile |
| Proxy dei due stemmi Flashscore | 86 / 29 ms | cache HTTP successiva disponibile |

Confronto JavaScript principale con la build pubblica precedente:

| Artefatto | Prima | Dopo |
|---|---:|---:|
| `main.js`, non compresso | 1.132.605 byte | 243.148 byte |
| `main.js`, gzip calcolato allo stesso modo | 332.065 byte | 77.619 byte |

Riduzione di circa il 76,6% del file principale compresso. Non equivale alla stessa riduzione dell'intero caricamento: l'editor corrente scarica anche i suoi chunk e le dipendenze condivise. I chunk maggiori restano separati e riutilizzabili.

Il cold start di un servizio gratuito non si risolve con il solo JavaScript: il warm-up all'apertura aiuta, ma per tempi prevedibili è necessario un backend che resti attivo. La copia locale di MediaPipe aggiunge asset statici alla build; i WASM vengono richiesti solo usando i filtri interessati.

## 5. Robustezza e sicurezza

Le API rifiutano parametri ripetuti, valori eccessivamente lunghi, ID partita non validi, slug con percorsi e URL partita esterni ai domini previsti. Il proxy rifiuta protocolli arbitrari, credenziali nell'URL, porte inattese e redirect verso domini non ammessi. Verifica il Content-Type prima di inoltrare immagini. Questi controlli sono coperti da test HTTP e unitari.

Il server limita il corpo JSON a 64 kB. Le risposte API hanno `Cache-Control: no-store`, per lasciare la politica di freschezza alle cache applicative. Firebase assegna cache lunga solo ai file `/static/` con hash e aggiunge `nosniff` e una policy del referrer. La lingua del documento è italiana e lo zoom mobile non è più disabilitato.

Sono stati aggiornati i lockfile con le correzioni compatibili e rimossi SDK non usati. Risultato dell'audit npm in questa sessione:

| Ambito | Situazione iniziale rilevata | Situazione dopo le correzioni |
|---|---|---|
| Root | 2 critiche | 0 vulnerabilità |
| Server | 31 totali, 1 critica e 20 alte | 12 totali: 2 moderate e 10 alte |
| Client | 56 totali, 2 critiche | 33 totali: 16 basse, 7 moderate e 10 alte |

I conteggi npm includono dipendenze transitive e propagazione degli avvisi ai pacchetti che le includono: non rappresentano altrettanti exploit dimostrati nell'app. Nel client molte segnalazioni riguardano strumenti di build/test/dev server e non codice servito da Firebase. Sul server rimane soprattutto la catena Puppeteer e una dipendenza di Express. Gli aggiornamenti principali suggeriti automaticamente da npm non sono stati forzati: ad esempio la proposta `react-scripts@0.0.0` non costituisce una migrazione utilizzabile.

Manca tuttora una policy di autenticazione e rate limit per le API onerose. I controlli URL e la coda browser limitano alcuni rischi, ma non sostituiscono l'autorizzazione degli utenti. Questo è un intervento prioritario prima di aprire il servizio a una redazione più ampia.

## 6. Verifiche eseguite

- `npm test`: 29 test backend e 66 frontend, tutti passati nel ciclo registrato.
- `CI=true npm run build`: compilazione riuscita, lint attivo, senza gli avvisi webpack precedenti.
- Test backend con HTTP reale su porta effimera: validazione parametri, health e URL rifiutati prima di avviare scraping.
- Test ricerca: chiave provider, filtro Soccer, catalogo esatto, fallimento e successivo retry.
- Test cache: richieste concorrenti a freddo, scadenza, risposta stale, singolo refresh, retry dopo errore.
- Test client: debounce, risultati locali immediati, risposte fuori ordine e consumatori annullati.
- Test import: stemmi dal feed, cambio partita, aggiornamenti parziali, rigori, cambio competizione e reset degli stemmi.
- Test asset: tutti i 41 percorsi del catalogo esistono con il case corretto, anche per il deploy Linux.
- Test export: stato dell'anteprima ripristinato anche se il canvas genera un'eccezione.
- Smoke HTTP ai provider reali: Roma, PAOK, competizioni Italia, partite greche, marcatori e immagini di entrambi gli stemmi.
- Browser sulla build prodotta: ricerca Roma selezionabile, import Kalamata–Iraklis con punteggio 1–1, loghi corretti e marcatori presenti.
- Download reale dal browser dopo l'import: JPEG generato correttamente, 2.880 × 3.600 pixel, anteprima ripristinata dopo l'esportazione.
- Bundle classifiche reale: 14 squadre regular season, 16 in coppa e 4 nel gruppo Nations League; fasi playoff ancora senza righe. Per due partite provate l'API formazioni ha restituito «non disponibili», caso gestito senza inventare titolari.

I test isolati usano dati controllati; lo smoke usa la rete. Questa separazione evita che un provider non disponibile renda casuale il risultato della suite.

## 7. Limiti e aree da approfondire

1. Flashscore non è un contratto API stabile: feed, campi, firma e markup possono cambiare. Il fallback DOM non offre necessariamente tutti i metadati del feed.
2. `daysBack` filtra i dati disponibili; non garantisce che Flashscore abbia esposto l'intero archivio storico richiesto. Servono paginazione e test di copertura per promettere uno storico completo.
3. La chiave TheSportsDB condivisa ha un limite globale. Una chiave di produzione e un catalogo persistente renderebbero il servizio più prevedibile con molti utenti.
4. Le competizioni principali vengono restituite subito; la ricerca non carica automaticamente anche tutte le divisioni minori dello stesso paese quando il catalogo ha già risultati. Una funzione «mostra altri campionati» può recuperarli separatamente.
5. La cache server è in memoria e si perde ai riavvii; più repliche non la condividono. Adeguata per l'attuale istanza singola, da rivedere per scalare.
6. Il timeout HTTP non cancella ogni operazione a monte dello scraper. I limiti di concorrenza riducono il rischio, ma va propagato `AbortSignal` fino ad Axios e alla pagina Puppeteer.
7. I filtri lavorano con array e canvas sul thread principale. Su foto grandi e telefoni meno potenti possono bloccare l'interfaccia.
8. Più editor DOM esportano la stessa immagine tre volte per stabilizzare font e rendering. Un export comune basato su `document.fonts.ready` e `img.decode()` può ridurre tempo e memoria, ma va provato sui template e sui browser mobili.
9. Stili globali dei vari editor possono interferire fra pagine. Il caricamento differito ne riduce il costo iniziale ma non sostituisce CSS Modules o un isolamento coerente.
10. Tailwind è ancora caricato tramite script CDN a runtime e il browser emette il relativo avviso. Va compilato in CSS statico in una migrazione del frontend, mantenendo il rendering dei template che usano classi arbitrarie.
11. Il testo formattato delle notizie usa `contentEditable` e `innerHTML`: prima di introdurre documenti condivisi/import da fonti non fidate va aggiunta una sanitizzazione con allowlist.
12. `functions/`, dump HTML/JSON e vecchi script temporanei già tracciati richiedono una pulizia separata. I nuovi temporanei sono esclusi da Git; non sono stati rimossi i file locali preesistenti dell'utente.
13. La generazione AI non è stata verificata end-to-end senza il token del servizio. La correzione dell'URL di produzione è verificata nel codice e nella build.
14. La compatibilità di download/share su iOS va provata su un dispositivo fisico. Il ripristino del canvas è coperto da test, ma non simula il sistema di condivisione del telefono.

## 8. Miglioramenti consigliati, in ordine

| Priorità | Intervento | Beneficio | Impegno indicativo |
|---|---|---|---|
| P1 | Autenticazione e limiti per IP/utente sugli endpoint onerosi | Protegge quota AI, provider e memoria | Medio |
| P1 | Migrazione CRA → Vite con test moderni e Tailwind compilato | Build più rapida, meno dipendenze obsolete e avvisi residui | Medio |
| P1 | Aggiornamento principale Puppeteer con test su Chromium Linux | Riduzione del debito di sicurezza sul backend | Medio |
| P1 | Monitoraggio errori e latenza per endpoint/provider | Rileva regressioni prima degli utenti | Piccolo/medio |
| P1 | Backend sempre attivo se usato quotidianamente | Elimina la variabilità del cold start | Piccolo; costo hosting da scegliere |
| P2 | Provider Flashscore isolato in moduli per risultati, incidenti, classifiche e formazioni | Cambi di feed circoscritti e fixture di regressione | Medio |
| P2 | Esportazione comune per tutti gli editor | Risoluzioni, font, errori e avanzamento coerenti | Medio |
| P2 | Web Worker / OffscreenCanvas per filtri e OCR | Interfaccia reattiva durante l'elaborazione | Medio/grande |
| P2 | Cache persistente e registro squadre per ID | Meno chiamate e nessuna ambiguità da omonimi | Medio |
| P2 | Test browser automatici desktop/mobile in CI | Copertura reale di selezione, canvas ed export | Medio |
| P3 | CSS Modules, componenti form condivisi, accessibilità completa | Meno interferenze e uso più semplice da tastiera | Medio |

Gli impegni sono qualitativi: vanno trasformati in stime dopo aver definito utenti, browser supportati e requisiti di produzione.

## 9. Funzioni che aggiungerei

1. **Bozze automatiche e recupero sessione.** Salvataggio locale con immagini in IndexedDB, ripristino dopo chiusura e avviso di modifiche non salvate. Per una redazione, successiva sincronizzazione autenticata.
2. **Undo/redo comune agli editor.** Cronologia di testo, posizioni, immagini e importazione come singola azione annullabile.
3. **Archivio squadre per ID.** Nome visualizzato, alias, paese, logo verificato, colori e provenienza; preferenze manuali riutilizzate nelle grafiche successive.
4. **Importazione con anteprima delle differenze.** Prima di sostituire una grafica già modificata, mostrare campi aggiornati, dati mancanti, fonte e data di acquisizione.
5. **Template personali.** Salvare palette, font, sponsor, posizione loghi e preset per competizione; duplicare una grafica senza ricostruirla.
6. **Esportazione multipla.** Dalla stessa notizia produrre post 4:5, storia 9:16 e quadrato con aree sicure e adattamento del testo.
7. **Controllo qualità prima dell'export.** Segnalare loghi mancanti, immagini ancora in caricamento, testo tagliato e font non disponibili; anteprima del file finale.
8. **Coda di lavoro per giornata.** Selezionare più partite, riutilizzare lo stile e generare le grafiche una dopo l'altra con revisione finale.
9. **Gestione collaborativa.** Ruoli autore/revisore, bozze condivise e approvazione della grafica prima della pubblicazione, solo dopo aver definito autenticazione e storage.

## 10. Deploy e verifica operativa

Il frontend viene pubblicato dal workflow GitHub Actions dopo test e build; Render distribuisce il backend dal `Dockerfile`. Il nuovo `/api/health-check` espone `revision` da `RENDER_GIT_COMMIT`: è il riferimento per verificare che il backend serva esattamente il commit richiesto.

La prima installazione pulita Linux ha individuato un peer opzionale `yaml@2.9.1` assente dal lockfile generato con npm 11. Il lockfile è stato completato e verificato anche con `npm ci --dry-run` di npm 10, usato dal runtime Node 22 della pipeline.

Prima di dichiarare concluso il rilascio vanno verificati: workflow Firebase riuscito, HTML pubblico della nuova build, revisione backend corretta, ricerca web reale e download dei loghi Flashscore. Il resoconto finale della sessione riporta l'esito effettivamente osservato, separando push e pubblicazione.
