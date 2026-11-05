// src/utils/serverWarmup.js
//
// Il backend su Render free tier va in sleep dopo ~15 minuti di inattività:
// la prima richiesta successiva paga un cold start di 30-60 secondi.
// Questo modulo lo tiene sveglio: ping all'avvio dell'app, keep-alive
// periodico e ping al ritorno sulla tab. Così quando l'utente apre
// "Cerca Web" il server è già caldo.

import config from '../config';

const KEEPALIVE_INTERVAL_MS = 10 * 60 * 1000; // sotto la soglia di sleep (~15 min)
const MIN_PING_GAP_MS = 60 * 1000;            // throttle: max 1 ping al minuto

let started = false;
let lastPingAt = 0;
let stopKeepAlive = null;

/**
 * Ping fire-and-forget al backend. Sicuro da chiamare spesso: è throttlato.
 */
export function pingServer() {
    const now = Date.now();
    if (now - lastPingAt < MIN_PING_GAP_MS) return;
    lastPingAt = now;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    fetch(`${config.API_BASE_URL}/api/health-check`, { cache: 'no-store', signal: controller.signal }).catch(() => {
        // Il ping serve solo a svegliare il server: gli errori non interessano
    }).finally(() => clearTimeout(timer));
}

/**
 * Avvia il keep-alive globale. Idempotente: la seconda chiamata è un no-op.
 */
export function startServerKeepAlive() {
    if (started) return stopKeepAlive;
    started = true;

    pingServer();
    const interval = setInterval(() => {
        if (document.visibilityState === 'visible') pingServer();
    }, KEEPALIVE_INTERVAL_MS);

    // Se l'utente torna sulla tab dopo un po', il server potrebbe essersi
    // riaddormentato (i timer delle tab in background vengono throttlati)
    const onVisible = () => {
        if (document.visibilityState === 'visible') pingServer();
    };
    document.addEventListener('visibilitychange', onVisible);
    stopKeepAlive = () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', onVisible);
        started = false;
        stopKeepAlive = null;
    };
    return stopKeepAlive;
}
