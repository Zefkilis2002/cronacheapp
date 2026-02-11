import PocketBase from 'pocketbase';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

// Connessione a PocketBase Locale (DEVE ESSERE ACCESO!)
const pb = new PocketBase('http://127.0.0.1:8090');

// Connessione a Firebase
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

async function migrate() {
    console.log("🚀 Inizio migrazione...");
    try {
        const records = await pb.collection('teams').getFullList();
        console.log(`📦 Trovati ${records.length} record.`);

        const batch = db.batch();
        let count = 0;

        for (const record of records) {
            // Usa il nome pulito come ID (es. "juventus")
            const docId = record.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (docId.length < 2) continue;

            const docRef = db.collection('teams').doc(docId);
            batch.set(docRef, {
                name: record.name,
                logo_url: record.logo_url,
                keywords: record.name.toLowerCase().split(' ')
            });
            count++;
        }
        await batch.commit();
        console.log(`✅ COMPLETATO! ${count} loghi caricati su Firebase.`);
    } catch (err) {
        console.error("❌ ERRORE:", err);
    }
}
migrate();