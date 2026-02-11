import PocketBase from 'pocketbase';
import * as cheerio from 'cheerio';

// 1. Configurazione
const SITE_URL = 'https://football-logos.cc/all/';
const DOMAIN = 'https://football-logos.cc';
const PB_URL = 'http://127.0.0.1:8090';

const pb = new PocketBase(PB_URL);

async function scrapeAndSave() {
    console.log(`📡 Mi connetto a ${SITE_URL}...`);

    try {
        // Scarica l'HTML della pagina
        const response = await fetch(SITE_URL);
        const html = await response.text();
        
        // Carica l'HTML in Cheerio
        const $ = cheerio.load(html);
        
        console.log("✅ Pagina scaricata. Inizio l'analisi dei loghi...");

        // Trova tutte le immagini nella griglia. 
        // Nota: Basato sulla struttura standard, cerchiamo le immagini dentro i link
        const teams = [];

        $('div.logo, div.item').each((i, element) => {
            // Cerca l'immagine e il nome
            const imgTag = $(element).find('img');
            const linkTag = $(element).find('a');
            
            let name = imgTag.attr('alt') || linkTag.attr('title') || $(element).text().trim();
            let src = imgTag.attr('src') || imgTag.attr('data-src');

            // Pulizia e validazione
            if (name && src) {
                // Se l'URL è relativo (es: /logos/img.png), aggiungi il dominio
                if (!src.startsWith('http')) {
                    src = DOMAIN + src;
                }

                // Aggiungi alla lista solo se sembra un logo valido
                teams.push({
                    name: name.trim(),
                    logo_url: src
                });
            }
        });

        console.log(`🧐 Trovati ${teams.length} possibili team.`);
        
        // Salvataggio nel database
        console.log("💾 Inizio il salvataggio su PocketBase...");
        
        let savedCount = 0;
        
        for (const team of teams) {
            try {
                // Controlla se esiste già per evitare duplicati (opzionale, ma consigliato)
                // Nota: Questo rallenta un po', se il DB è vuoto puoi commentare la ricerca
                /* const existing = await pb.collection('teams').getList(1, 1, {
                    filter: `name = "${team.name}"`
                });
                if (existing.totalItems > 0) {
                    console.log(`⏩ Salto ${team.name} (esiste già)`);
                    continue;
                }
                */

                await pb.collection('teams').create({
                    name: team.name,
                    logo_url: team.logo_url
                });
                
                savedCount++;
                process.stdout.write(`\r✅ Salvati: ${savedCount}/${teams.length} - Ultimo: ${team.name}`);
                
            } catch (err) {
                console.error(`\n❌ Errore salvando ${team.name}:`, err.message);
            }
        }

        console.log(`\n\n🎉 Finito! Salvati ${savedCount} nuovi loghi nel database.`);

    } catch (error) {
        console.error("❌ Errore generale:", error);
    }
}

scrapeAndSave();