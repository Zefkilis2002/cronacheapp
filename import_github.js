import PocketBase from 'pocketbase';

// --- NUOVA FONTE DATI ---
// Usiamo il repository di 'luukhopman' che è famoso per avere loghi puliti divisi per nazione
const GITHUB_USER = 'luukhopman';
const GITHUB_REPO = 'football-logos'; 
const BRANCH = 'master'; 

const PB_URL = 'http://127.0.0.1:8090';

// API GitHub per scaricare l'albero dei file
const API_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/git/trees/${BRANCH}?recursive=1`;
const RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${BRANCH}/`;

const pb = new PocketBase(PB_URL);

async function importRealLogos() {
    console.log(`📡 Contatto GitHub (Repo: ${GITHUB_USER})...`);

    try {
        // 1. Scarica la lista dei file
        const response = await fetch(API_URL);
        
        if (response.status === 403) {
            throw new Error("⛔ Limite API GitHub raggiunto. Aspetta un'ora o usa una VPN, oppure devi generare un token.");
        }
        if (!response.ok) {
            throw new Error(`Errore GitHub API: ${response.status}`);
        }

        const data = await response.json();
        
        // 2. Filtra solo i file PNG dentro la cartella 'logos'
        // La struttura di questo repo è: logos/CountryCode/TeamName.png
        const images = data.tree.filter(item => 
            item.path.startsWith('logos/') && 
            item.path.endsWith('.png')
        );

        console.log(`✅ Trovati ${images.length} loghi validi.`);
        console.log("💾 Inizio importazione su PocketBase...");

        let savedCount = 0;

        for (const item of images) {
            // Esempio path: logos/IT/Juventus FC.png
            const parts = item.path.split('/');
            const filename = parts[parts.length - 1]; // "Juventus FC.png"
            
            // Pulisce il nome
            let name = filename.replace('.png', '')
                               .replace(/_/g, ' ')
                               .replace(/-/g, ' ');

            const fullUrl = RAW_BASE_URL + encodeURIComponent(item.path).replace(/%2F/g, '/');

            try {
                // Creiamo il record
                // requestKey: null serve a velocizzare le richieste in parallelo
                await pb.collection('teams').create({
                    name: name.trim(),
                    logo_url: fullUrl
                }, { requestKey: null });

                savedCount++;
                
                // Feedback ogni 10 salvataggi
                if (savedCount % 10 === 0) {
                    process.stdout.write(`\r✅ Importati: ${savedCount} / ${images.length} - Ultimo: ${name}`);
                }

            } catch (err) {
                // Ignora duplicati o errori
            }
        }

        console.log(`\n\n🎉 OPERAZIONE COMPLETATA!`);
        console.log(`✅ Totale salvati nel database: ${savedCount}`);

    } catch (error) {
        console.error("\n❌ ERRORE:", error.message);
    }
}

importRealLogos();