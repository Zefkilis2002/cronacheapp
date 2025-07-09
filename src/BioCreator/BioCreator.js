import React, { useState, useRef } from 'react';
import OpenAI from 'openai';
import './BioCreator.css';
import sendIcon from './send.png'; 

const BioCreator = () => {
  const [inputText, setInputText] = useState('');
  const [generatedBio, setGeneratedBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Utilizziamo un ref per l'elemento contentEditable in modalità modifica
  const editableRef = useRef(null);

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  const generateBio = async () => {
    if (!inputText.trim()) {
      setError('Per favore inserisci del testo prima di generare la bio.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const client = new OpenAI({
        baseURL: "https://models.inference.ai.azure.com",
        apiKey: process.env.REACT_APP_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `
Obiettivo: Generare una **bio Instagram accattivante e dinamica**, adatta ad una pagina Instagram giornalistica che parla del calcio greco, a partire da un testo iniziale, che può essere scritto in greco ma deve essere **tradotto e adattato in italiano**.

### Struttura della Bio
1. **Titolo di grande impatto**, scritto in **grassetto maiuscolo Unicode**, per un effetto visivo ottimale sui social.
2. **Testo breve e diretto**, con frasi concise, ritmo vivace e scorrevolezza.
3. **Inserimento strategico di emoji** per sottolineare emozioni, concetti chiave e aggiungere personalità.
4. **Organizzazione in sezioni**, quando utile, per presentare risultati, numeri importanti o momenti chiave.
5. **Domanda finale**, inerente al contenuto della bio, progettata per invitare il pubblico all'interazione.

### Specifiche
- Il testo iniziale può essere in greco, ma la bio deve essere **scritta esclusivamente in italiano**.
- Preferire un linguaggio semplice, **diretto e di forte impatto**, evitando periodi lunghi o complessi.

Ecco degli esempi di bio:
1. "💚⚽ 𝗜𝗢𝗔𝗡𝗡𝗜𝗗𝗜𝗦 𝗥𝗔𝗚𝗚𝗜𝗨𝗡𝗚𝗘 𝗜 𝟱𝟬 𝗚𝗢𝗟 𝗖𝗢𝗡 𝗜𝗟 𝗧𝗥𝗜𝗙𝗢𝗚𝗟𝗜𝗢, 𝗠𝗔 𝗡𝗢𝗡 𝗕𝗔𝗦𝗧𝗔!

Il Panathinaikos saluta la UEFA Conference League dopo una serata sfortunata al Franchi.

Nonostante l'uscita di scena, i biancoverdi hanno lottato fino all'ultimo, sfiorando il secondo gol in un secondo tempo dominato per intensità e carattere."

2. "🔥 𝗟𝗢𝗧𝗧𝗔 𝗦𝗖𝗨𝗗𝗘𝗧𝗧𝗢: 𝗥𝗜𝗦𝗨𝗟𝗧𝗔𝗧𝗜 𝗖𝗛𝗘 𝗖𝗔𝗠𝗕𝗜𝗔𝗡𝗢 𝗚𝗟𝗜 𝗘𝗤𝗨𝗜𝗟𝗜𝗕𝗥𝗜 𝗜𝗡 𝗚𝗥𝗘𝗖𝗜𝗔! 🇬🇷💥

🟡⚫ AEK travolgente: cinquina e -2 dall'Olympiacos!
Con una prestazione dominante, l'AEK spazza via l'avversario con un netto 5-0 nell'OPAP Arena a porte chiuse. Marcial e Ljubičić sugli scudi, regalando una vittoria che avvicina i gialloneri alla vetta, ora distante solo due punti.

🟡⚫ L'Aris frena il Panathinaikos con una difesa perfetta!
Il Panathinaikos cade sotto i colpi dell'Aris, che con una prestazione solida e organizzata mantiene il -3 dal PAOK.
❌☘️ Prima sconfitta in campionato per la squadra di Vitoria, che resta a -5 dalla vetta sprecando un'occasione d'oro per ridurre il distacco dall'Olympiacos.

💥 Asteras sorprende l'Olympiacos e lo blocca al Pireo!
I biancorossi non riescono a sfondare nonostante le tante occasioni nel finale e vedono sfumare tre punti importanti nella corsa al titolo.

⚪️⚫ PAOK straripante, travolto l'OFI!
Con una partenza lampo, il PAOK chiude la partita già nei primi 30 minuti e si impone con autorità sull'OFI.
😲 Samatta ritrova la via del gol dopo 454 giorni e firma una doppietta.
I bianconeri si portano a -3 da AEK e Panathinaikos e a -7 dall'Olympiacos, ma con una partita in più.

🔥 La corsa al titolo è apertissima: chi riuscirà a spuntarla? 🤔"

3. "🌟🇬🇷 𝑺𝑻𝑬𝑭𝑨𝑵𝑶𝑺 𝑻𝒁𝑰𝑴𝑨𝑺 𝑨𝑷𝑷𝑹𝑶𝑫𝑨 𝑰𝑵 𝑷𝑹𝑬𝑴𝑰𝑬𝑹 𝑳𝑬𝑨𝑮𝑼𝑬! 🇬🇷🌟

Nel giorno della chiusura del mercato, uno dei talenti emergenti della Grecia, Stefanos Tzimas (19), ha firmato ufficialmente con il Brighton & Hove Albion per una cifra totale di circa 25 milioni di euro.

💰 Affare d'oro per il PAOK!
L'ex club di Tzimas, il PAOK Salonicco, incasserà circa 22 milioni di euro, grazie alla precedente vendita del giocatore al Norimberga per 18 milioni di euro, più un profitto del 15% su una futura cessione, come stabilito dal contratto con il club tedesco.

🔄 Ultimi mesi in Germania, poi la Premier!
Tzimas terminerà la stagione in prestito al Norimberga, prima di approdare definitivamente in Premier League con il Brighton all'inizio della prossima stagione.

🔥 Un nuovo talento greco pronto a brillare in Inghilterra! 🔥"
            `
          },
          {
            role: 'user',
            content: `Testo di partenza: ${inputText}`
          }
        ],
        model: "gpt-4o",
        temperature: 0.75,
        max_tokens: 4096,
        top_p: 1,
      });

      const bio = completion.choices[0].message.content;
      setGeneratedBio(bio);
    } catch (error) {
      console.error('Errore nella generazione della bio:', error);
      if (error.status === 429) {
        setError('Hai superato la tua quota API. Controlla il tuo piano e i dettagli di fatturazione.');
      } else if (error.status) {
        setError(`Errore API: ${error.status} - ${error.message || 'Errore sconosciuto'}`);
      } else {
        setError(`Si è verificato un errore: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedBio);
    alert('Bio copiata negli appunti!');
  };

  // Quando clicchi su "Salva" in modalità modifica, prendiamo il contenuto corrente dal ref
  const handleSave = () => {
    if (editableRef.current) {
      setGeneratedBio(editableRef.current.innerText);
    }
    setIsEditing(false);
  };

  // Se non siamo in editing, il bottone "Modifica" attiva la modalità di modifica
  const handleEdit = () => {
    setIsEditing(true);
    // Nota: il ref manterrà il contenuto e il cursore non verrà reimpostato
  };

  return (
    <div className="App">
      <div className="bio-creator-container">
        <h1>Generatore Bio Instagram</h1>
        
        <div className="prompt-section">
          <h3 className="prompt-section-text">Cronache AI: Crea la tua bio</h3>
          <textarea
            className="prompt-input"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Incolla o scrivi il testo qui (può essere in greco)..."
            rows="8"
          />
          
          <div className="prompt-actions">
            <button
              className={`action-button send-button ${isLoading ? 'disabled' : ''}`}
              onClick={generateBio}
              disabled={isLoading}
            >
              <img src={sendIcon} alt="Send" />
            </button>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        
        <div className="output-section">
          <h3>La tua Bio Instagram</h3>
          {isEditing ? (
            <div
              className="bio-output editable"
              contentEditable={true}
              ref={editableRef}
              suppressContentEditableWarning={true}
            >
              {generatedBio}
            </div>
          ) : (
            <div className="bio-output">
              {generatedBio || 'La tua bio apparirà qui...'}
            </div>
          )}
          <div className="output-actions">
            <button 
              className="copy-button" 
              onClick={handleCopy}
              disabled={!generatedBio}
            >
              Copia negli appunti
            </button>
            {isEditing ? (
              <button className="edit-button" onClick={handleSave}>
                Salva
              </button>
            ) : (
              <button 
                className="edit-button" 
                onClick={handleEdit}
                disabled={!generatedBio}
              >
                Modifica
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BioCreator;
