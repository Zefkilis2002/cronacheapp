import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import './BioCreator.css';

const BioCreator = () => {
  const [inputText, setInputText] = useState('');
  const [generatedBio, setGeneratedBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const editableRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'immagine è troppo grande. Massimo 5MB.');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        setImagePreview(reader.result);

        // Esegui OCR
        setIsOCRLoading(true);
        setError('');
        try {
          const { data: { text } } = await Tesseract.recognize(
            reader.result,
            'ita+eng+ell',
            { logger: m => console.log(m) }
          );
          if (text && text.trim()) {
            setInputText(prev => prev ? `${prev}\n${text.trim()}` : text.trim());
          }
        } catch (err) {
          console.error('Errore OCR:', err);
          setError('Errore durante la lettura del testo dall\'immagine.');
        } finally {
          setIsOCRLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const generateBio = async () => {
    if (!inputText.trim()) {
      setError('Per favore inserisci del testo prima di generare la bio.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/generate-bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputText }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(data.message || 'Errore nella generazione della bio');
      }

      setGeneratedBio(data.bio);
    } catch (error) {
      console.error('Errore nella generazione della bio:', error);
      setError(`Si è verificato un errore: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedBio);
    alert('Bio copiata negli appunti!');
  };

  const handleSave = () => {
    if (editableRef.current) {
      setGeneratedBio(editableRef.current.innerText);
    }
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  // Aggiornati per essere simili all'immagine: senza titolo marcato, focus sull'azione
  const suggestions = [
    {
      icon: "👤",
      prompt: "Genera una bio per un post post-partita. Includi titolo d'effetto in unicode e descrizione del match divisa in paragrafi."
    },
    {
      icon: "✉️",
      prompt: "Crea una bio per una notizia di calciomercato o un aggiornamento importante."
    },
    {
      icon: "🧠",
      prompt: "Scrivi una bio sulla storia di questo club o giocatore."
    }
  ];

  const handleSuggestionClick = (prompt) => {
    setInputText(prompt);
  };

  return (
    <div className="bio-creator-page">
      <div className="bio-content-wrapper">
        <div className="bio-header">
          <h1>CREA LA TUA BIO</h1>
          <p className="subtitle">Incolla il testo da cui vuoi partire per creare la tua bio, oppure raccontami l’argomento su cui desideri che la realizzi.</p>        </div>

        {!generatedBio && (
          <div className="suggestions-grid">
            {suggestions.map((item, index) => (
              <div
                key={index}
                className="suggestion-card"
                onClick={() => handleSuggestionClick(item.prompt)}
              >
                <div className="card-icon">{item.icon}</div>
                <p>{item.prompt}</p>
              </div>
            ))}
          </div>
        )}

        {generatedBio && (
          <div className="output-section-new">
            <div className="output-header">
              <h3>La tua Bio Generata</h3>
              <div className="output-actions-top">
                <button onClick={() => setGeneratedBio('')} className="close-output-btn">✕</button>
              </div>
            </div>

            {isEditing ? (
              <div
                className="bio-output-new editable"
                contentEditable={true}
                ref={editableRef}
                suppressContentEditableWarning={true}
              >
                {generatedBio}
              </div>
            ) : (
              <div className="bio-output-new">
                {generatedBio}
              </div>
            )}

            <div className="output-actions-new">
              <button className="action-btn copy-btn" onClick={handleCopy}>
                Copia
              </button>
              {isEditing ? (
                <button className="action-btn save-btn" onClick={handleSave}>
                  Salva
                </button>
              ) : (
                <button className="action-btn edit-btn" onClick={handleEdit}>
                  Modifica
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="input-bar-container">
        <div className="input-bar-wrapper">
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button className="attachment-btn" onClick={triggerFileInput}>
            {/* SVG pulito per l'icona "link/allegato" come nell'immagine */}
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 11V6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6V15C8 16.1046 8.89543 17 10 17C11.1046 17 12 16.1046 12 15V7H13.5V15C13.5 16.933 11.933 18.5 10 18.5C8.067 18.5 6.5 16.933 6.5 15V6C6.5 2.96243 8.96243 0.5 12 0.5C15.0376 0.5 17.5 2.96243 17.5 6V11H16Z" />
            </svg>
          </button>

          <div className="input-content-area">
            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="image-preview-thumb" />
                <button className="remove-image-btn" onClick={removeImage}>✕</button>
              </div>
            )}
            {isOCRLoading && (
              <div className="ocr-loader">Analisi testo in corso...</div>
            )}
            <textarea
              ref={textareaRef}
              className="modern-input"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Chiedi qualsiasi cosa..."
              rows="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  generateBio();
                }
              }}
            />
          </div>

          <button
            className={`send-btn-modern ${isLoading ? 'loading' : ''}`}
            onClick={generateBio}
            disabled={isLoading || (!inputText.trim() && !selectedImage)}
          >
            {isLoading ? (
              <div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '2px', marginTop: '1px' }}>
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
        {error && <div className="error-toast">{error}</div>}
      </div>
    </div>
  );
};

export default BioCreator;