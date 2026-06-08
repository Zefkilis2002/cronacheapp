import PocketBase from 'pocketbase';

// Inizializza il client con l'indirizzo locale di PocketBase
const pb = new PocketBase('http://127.0.0.1:8090');

async function getTeams() {
    try {
        // Recupera la lista dei team dalla collezione che hai creato
        const records = await pb.collection('teams').getFullList();
        console.log(records);
    } catch (err) {
        console.error("Errore nel recupero dati:", err);
    }
}

getTeams();