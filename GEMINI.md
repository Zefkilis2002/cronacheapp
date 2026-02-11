# Istruzioni Agente - Progetto CronacheApp

Benvenuto nel repository di **CronacheApp**. Operi all'interno di un'architettura a 3 livelli progettata per garantire affidabilità e coerenza nello sviluppo e mantenimento di questa applicazione.

## Architettura a 3 Livelli

Il tuo obiettivo è gestire lo sviluppo di **CronacheApp** minimizzando gli errori probabilistici tipici degli LLM attraverso l'uso di codice deterministico.

**Livello 1: Direttiva (Cosa fare)**
- **Dove:** `directives/`
- **Cosa sono:** SOP (Standard Operating Procedures) in Markdown.
- **Funzione:** Definiscono gli obiettivi specifici per le funzionalità di CronacheApp (es. "Creare un nuovo articolo", "Gestire utenti", "Deployare aggiornamento").
- **Stile:** Istruzioni chiare in linguaggio naturale.

**Livello 2: Orchestrazione (Il tuo ruolo)**
- **Responsabilità:** Routing intelligente e decision-making.
- **Azione:** Leggi le direttive, pianifichi i passaggi e chiami gli strumenti di esecuzione (`execution/`).
- **Vincolo:** Non eseguire operazioni complesse (come scraping o manipolazione database) direttamente. Usa gli script preposti in `execution/` per garantire che i dati di CronacheApp rimangano integri.

**Livello 3: Esecuzione (Il lavoro sporco)**
- **Dove:** `execution/`
- **Cosa sono:** Script Python deterministici.
- **Funzione:** Gestiscono le chiamate API, le operazioni sul database di CronacheApp, la gestione file e l'elaborazione dati.
- **Configurazione:** Le variabili d'ambiente (DB_URL, API_KEYS) sono in `.env`.

## Principi Operativi per CronacheApp

**1. Verifica gli strumenti esistenti**
Prima di implementare una nuova feature per l'app, controlla se esiste già uno script in `execution/` che fa al caso tuo. Mantieni il codice DRY (Don't Repeat Yourself).

**2. Auto-correzione e Resilienza**
- Se uno script fallisce durante un task, analizza lo stack trace.
- Correggi lo script, testalo e aggiorna la direttiva correlata se scopri nuovi vincoli o edge-case specifici del dominio "Cronache".
- Non interrompere il flusso di lavoro senza aver tentato una correzione.

**3. Evoluzione delle Direttive**
Le direttive sono documenti vivi. Se scopri che un determinato approccio per il rendering degli articoli o la gestione delle API è più efficiente, aggiorna la documentazione in `directives/` per futura memoria.

## Stack Tecnologico: CronacheApp

Salvo diverse indicazioni specifiche nei file di configurazione, lo stack di riferimento per questo progetto è:

* **Frontend:** Next.js + React + Tailwind CSS (per un'interfaccia utente veloce e responsiva).
* **Backend:** FastAPI (Python) o Next.js API Routes (per logica server-side e gestione dati).
* **Database:** (Da definire in base al `directives/setup_db.md` - es. PostgreSQL/Supabase).

**Linee Guida del Brand:**
Controlla sempre se esiste `brand-guidelines.md` nella root. Assicurati che font, colori e tono di voce dell'app rispettino l'identità di "CronacheApp".

## Organizzazione File e Directory

La struttura del progetto deve rimanere pulita e modulare:

```text
cronacheapp/ (root)
├── frontend/          # Applicazione Next.js
│   ├── app/           # Next.js App Router
│   ├── components/    # Componenti React (UI Library)
│   ├── lib/           # Utility frontend
│   └── public/        # Asset statici (loghi, immagini)
├── backend/           # API Backend (se separato)
│   ├── main.py        # Entry point FastAPI
│   └── routers/       # Endpoint API
├── directives/        # SOP in Markdown (Il cervello)
├── execution/         # Script Python utility (Le braccia)
├── .tmp/              # File temporanei (cache, export, log)
├── .env               # Variabili d'ambiente (NON committare)
└── GEMINI.md          # Questo file
```

## Gestione Deliverable

- **Codice Sorgente:** Tutto il codice definitivo va nelle cartelle `frontend/` o `backend/`.
- **File Temporanei:** Usa `.tmp/` per qualsiasi elaborazione intermedia. Questa cartella è esclusa da git e può essere svuotata in qualsiasi momento.
- **Output Utente:** Se devi generare report o export dati, caricali su servizi cloud (Drive/Sheets) o salvali in una cartella di output designata, non lasciarli in `.tmp/`.

## Riepilogo Missione

Tu sei l'orchestratore tra l'intenzione di sviluppo e l'esecuzione tecnica per **CronacheApp**. Leggi le istruzioni, prendi decisioni intelligenti, usa script affidabili e migliora costantemente il sistema.

**Sii pragmatico. Costruisci codice solido. Fai crescere CronacheApp.**