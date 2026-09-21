import React, { useRef, useState, useEffect } from 'react';

// Dimensioni di design del riquadro foto nel poster (px). Il poster importa le
// stesse costanti così il ritaglio scelto qui combacia con la resa finale.
export const FRAME_W = 214;
export const FRAME_H = 243;

const DISPLAY_W = 240;   // larghezza dell'area di ritaglio nel pannello (px schermo)
const MIN_FRAC = 0.06;   // lato minimo del riquadro, in frazione della foto

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Quali bordi muove ogni maniglia (ognuno indipendente: ritaglio libero).
const EDGES = {
    nw: ['w', 'n'], n: ['n'], ne: ['e', 'n'],
    w: ['w'], e: ['e'],
    sw: ['w', 's'], s: ['s'], se: ['e', 's'],
};

/**
 * Ritaglio della foto giocatore come in "Foto" di Windows: la foto è mostrata
 * INTERA e sopra c'è un riquadro libero. Si trascina per spostarlo e si
 * ridimensiona da OGNI lato e da OGNI angolo in modo indipendente (larghezza e
 * altezza separate: nessun vincolo di proporzione).
 *
 * Non deforma nulla: salva solo cropX/cropY/cropW/cropH (frazioni 0..1 della
 * foto) + le dimensioni naturali. Il poster mostra quella porzione scalandola
 * in modo UNIFORME dentro allo slot; se il ritaglio ha proporzioni diverse
 * dallo slot resta un margine trasparente (coerente con le foto-scontorno).
 */
const PhotoCropper = ({ src, crop, onChange }) => {
    const [nat, setNat] = useState(null); // { w, h } px naturali della foto
    const areaRef = useRef(null);
    const dragRef = useRef(null);

    const imgAspect = nat ? nat.w / nat.h : FRAME_W / FRAME_H;
    const dispH = DISPLAY_W / imgAspect; // l'area ha lo stesso rapporto della foto

    const hasCrop = crop && crop.w > 0 && crop.h > 0;
    const c = hasCrop ? crop : { x: 0, y: 0, w: 1, h: 1 };

    // Alla nuova foto: misura le dimensioni naturali con un Image() a parte
    // (l'onload dell'<img> renderizzato per un data URL può non scattare) e, se
    // non c'è ancora un ritaglio valido (foto nuova o "reimposta"), parte dalla
    // foto intera. Le dimensioni naturali si salvano comunque per il poster.
    useEffect(() => {
        let done = false;
        setNat(null);
        const probe = new Image();
        probe.onload = () => {
            if (done || !probe.naturalWidth || !probe.naturalHeight) return;
            const n = { w: probe.naturalWidth, h: probe.naturalHeight };
            setNat(n);
            const valid = crop && crop.w > 0 && crop.h > 0;
            if (valid) {
                onChange({ photoNatW: n.w, photoNatH: n.h });
            } else {
                onChange({ cropX: 0, cropY: 0, cropW: 1, cropH: 1, photoNatW: n.w, photoNatH: n.h });
            }
        };
        probe.src = src;
        return () => { done = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    const startDrag = (mode) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* no-op */ }
        const r = areaRef.current.getBoundingClientRect();
        dragRef.current = { mode, px: e.clientX, py: e.clientY, start: { ...c }, aw: r.width, ah: r.height };
    };

    const onMove = (e) => {
        const d = dragRef.current;
        if (!d) return;
        const dx = (e.clientX - d.px) / d.aw;
        const dy = (e.clientY - d.py) / d.ah;
        const s = d.start;

        if (d.mode === 'move') {
            onChange({
                cropX: clamp(s.x + dx, 0, 1 - s.w),
                cropY: clamp(s.y + dy, 0, 1 - s.h),
                cropW: s.w,
                cropH: s.h,
            });
            return;
        }

        // Ogni bordo si muove per conto suo: larghezza e altezza indipendenti.
        const edges = EDGES[d.mode] || [];
        let left = s.x;
        let top = s.y;
        let right = s.x + s.w;
        let bottom = s.y + s.h;
        if (edges.includes('w')) left = clamp(s.x + dx, 0, right - MIN_FRAC);
        if (edges.includes('e')) right = clamp(s.x + s.w + dx, left + MIN_FRAC, 1);
        if (edges.includes('n')) top = clamp(s.y + dy, 0, bottom - MIN_FRAC);
        if (edges.includes('s')) bottom = clamp(s.y + s.h + dy, top + MIN_FRAC, 1);

        onChange({ cropX: left, cropY: top, cropW: right - left, cropH: bottom - top });
    };

    const endDrag = (e) => {
        dragRef.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) { /* no-op */ }
    };

    const showWhole = () => onChange({ cropX: 0, cropY: 0, cropW: 1, cropH: 1 });

    if (!src) return null;

    const handleProps = (mode) => ({
        onPointerDown: startDrag(mode),
        onPointerMove: onMove,
        onPointerUp: endDrag,
        onPointerCancel: endDrag,
    });

    return (
        <div className="lu2-cropper">
            <div ref={areaRef} className="lu2-crop-area" style={{ width: DISPLAY_W, height: dispH }}>
                <img src={src} alt="" draggable={false} className="lu2-crop-img" />
                <div
                    className="lu2-crop-box"
                    style={{
                        left: `${c.x * 100}%`,
                        top: `${c.y * 100}%`,
                        width: `${c.w * 100}%`,
                        height: `${c.h * 100}%`,
                    }}
                    {...handleProps('move')}
                >
                    {['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map((m) => (
                        <span key={m} className={`lu2-crop-h ${m}`} {...handleProps(m)} />
                    ))}
                </div>
            </div>

            <div className="lu2-row" style={{ marginTop: 8 }}>
                <button type="button" className="lu2-mini" onClick={showWhole}>
                    Tutta la foto
                </button>
            </div>
            <div className="lu2-hint">
                Trascina il riquadro per spostarlo, i lati o gli angoli per ritagliare liberamente in
                larghezza e altezza. Le proporzioni della foto non cambiano mai.
            </div>
        </div>
    );
};

export default PhotoCropper;
