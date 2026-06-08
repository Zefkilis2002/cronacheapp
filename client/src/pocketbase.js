import PocketBase from 'pocketbase';

// Questo è l'indirizzo del tuo PocketBase locale.
// IMPORTANTE: pocketbase serve deve essere attivo nell'altro terminale!
const pb = new PocketBase('http://127.0.0.1:8090');

// Disabilita l'auto-cancellazione delle richieste (utile se carichi tanti loghi insieme)
pb.autoCancellation(false);

export default pb;