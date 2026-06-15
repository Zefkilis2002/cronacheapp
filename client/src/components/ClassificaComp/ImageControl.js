import React, { useRef } from 'react';
import { applyAcrSportFilterToSrc, applyUpscaleFilterToSrc } from '../../filters/acrSport';

const ImageControl = ({
    userImage,
    setUserImage,
    filterApplied,
    setFilterApplied,
    isLoading,
    setIsLoading,
    handleDownload
}) => {
    const fileInputRef = useRef(null);
    const originalImageRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const imageUrl = ev.target.result;
            originalImageRef.current = imageUrl; // Store original
            setUserImage(imageUrl);
            setFilterApplied(false);
        };
        reader.readAsDataURL(file);
    };

    const applyFilter = async () => {
        if (!originalImageRef.current) return;
        setIsLoading(true);
        try {
            const { url } = await applyAcrSportFilterToSrc(originalImageRef.current);
            setUserImage(url);
            setFilterApplied(true);
        } catch (error) {
            console.error('Error applying filter:', error);
            alert('Errore Filtro: ' + (error.message || error));
        } finally {
            setIsLoading(false);
        }
    };

    const removeFilter = () => {
        if (originalImageRef.current) {
            // Revoca il blob URL filtrato per evitare memory leak
            if (userImage && userImage.startsWith('blob:')) {
                try { URL.revokeObjectURL(userImage); } catch (_) { }
            }
            setUserImage(originalImageRef.current);
            setFilterApplied(false);
        }
    };

    const applyUpscale = async () => {
        // Determine source (current userImage might be filtered or original)
        // Generally upscale works better on original or needs to be careful. 
        // For simplicity, let's upscale the *current* image or original? 
        // Reference implementation in TabellinoControls upscales the *original* usually or current source.
        // Let's upscale originalImageRef to avoid double filtering issues, or user preference.
        const src = originalImageRef.current || userImage;
        if (!src) return;

        setIsLoading(true);
        try {
            const { url } = await applyUpscaleFilterToSrc(src);
            // Aggiorna l'originale con la versione upscalata per coerenza con filtri successivi
            originalImageRef.current = url;
            setUserImage(url);
            setFilterApplied(false); // Reset filter state since the base image changed
        } catch (error) {
            console.error('Error upscaling:', error);
            alert('Errore Upscale: ' + (error.message || error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>

            <div className="image-control-buttons">
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleImageUpload}
                />

                <button
                    onClick={() => fileInputRef.current.click()}
                    disabled={isLoading}
                    className="neon-button"
                    style={{ minWidth: '80px' }}
                >
                    File
                </button>

                <button
                    onClick={filterApplied ? removeFilter : applyFilter}
                    disabled={!userImage || isLoading}
                    className="neon-button"
                    style={{
                        minWidth: '80px',
                        borderColor: filterApplied ? '#ff4d4d' : undefined,
                        color: filterApplied ? '#ff4d4d' : undefined,
                        boxShadow: filterApplied ? '0 0 10px rgba(255, 77, 77, 0.4)' : undefined
                    }}
                >
                    {filterApplied ? 'Reset' : 'Filtro'}
                </button>

                <button
                    onClick={applyUpscale}
                    disabled={!userImage || isLoading}
                    className="neon-button"
                    style={{
                        minWidth: '80px',
                        borderColor: '#00ccff',
                        color: '#00ccff',
                        boxShadow: '0 0 10px rgba(0, 204, 255, 0.2)'
                    }}
                >
                    Upscale
                </button>

                <button
                    onClick={handleDownload}
                    className="neon-button download-btn"
                    style={{
                        backgroundColor: '#b4ff00',
                        color: '#00061b',
                        boxShadow: '0 0 15px rgba(180, 255, 0, 0.6)'
                    }}
                >
                    DOWNLOAD
                </button>
            </div>

            {isLoading && (
                <p style={{ fontSize: '0.9rem', color: '#b4ff00', textAlign: 'center', marginTop: '5px' }}>
                    Elaborazione immagine in corso...
                </p>
            )}
        </div>
    );
};

export default ImageControl;
