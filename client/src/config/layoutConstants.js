export const FULLTIME_LAYOUT = {
  STAGE: {
    WIDTH: 1440,
    HEIGHT: 1800,
    BORDER: {
      X: 2.5,
      Y: 2.5,
      WIDTH: 1435,
      HEIGHT: 1795,
      STROKE_WIDTH: 5,
      STROKE: 'white'
    }
  },
  LOGO_1: {
    startX: 215,
    startY: 1270,
    defaultScaleX: 0.90,
    defaultScaleY: 0.90,
    maxWidth: 200,
    maxHeight: 200
  },
  LOGO_2: {
    startX: 1052,
    startY: 1274,
    defaultScaleX: 0.90,
    defaultScaleY: 0.90,
    maxWidth: 200,
    maxHeight: 200
  },
  // Logo competizione (solo tabellino "general"): centrato nel pannello centrale.
  // startX/startY sono il PUNTO CENTRALE del logo (nel Canva si usa offset = metà
  // delle dimensioni), così il logo resta centrato qualunque sia il suo aspect ratio.
  COMPETITION_LOGO: {
    startX: 720,
    startY: 1364,
    defaultScaleX: 1,
    defaultScaleY: 1,
    maxWidth: 170,
    maxHeight: 170
  },
  SCORE_1: {
    startX: 485,
    startY: 1282,
    fontSize: 160,
    scaleX: 0.8
  },
  SCORE_2: {
    startX: 848,
    startY: 1282,
    fontSize: 160,
    scaleX: 0.8
  },
  SCORERS: {
    TEAM_1: {
      startX: 180,
      startY: 1510,
      yOffset: 40,
      fontSize: 30,
      fontFamily: 'Benzin-SemiBold'
    },
    TEAM_2: {
      startX: 680,
      startY: 1510,
      yOffset: 40,
      width: 600,
      fontSize: 30,
      fontFamily: 'Benzin-SemiBold'
    }
  },
  PENALTIES: {
    startX: 470,
    startY: 1558,
    width: 500,
    fontSize: 38,
    fontFamily: 'Benzin-SemiBold',
    color: 'white',
    letterSpacing: 0.5
  },
  USER_IMAGE: {
    startX: 100,
    startY: 100,
    defaultScaleX: 1,
    defaultScaleY: 1,
    minScale: 0.1,
    maxScale: 5
  },
  MOVE_STEP: 4,
  SCALE_STEP: 0.1
};

export const NEWS_LAYOUT = {
  STAGE: {
    WIDTH: 1440,
    HEIGHT: 1800
  },
  USER_IMAGE: {
    startX: 720,
    startY: 900,
    defaultScaleX: 1,
    defaultScaleY: 1
  },
  LOGO: {
    startX: 65,
    startY: 1260,
    defaultScaleX: 0.5,
    defaultScaleY: 0.5,
    minScale: 0.1,
    scaleStep: 0.02,
    moveStep: 2
  },
  TITLE: {
    startX: 0,
    startY: 1200,
    fontSize: 180,
    fontFamily: 'Kenyan Coffee Bold',
    color: '#FFFFFF'
  },
  TEXT: {
    startX: 0,
    startY: 1385,
    fontSize: 100,
    fontFamily: 'Kenyan Coffee Regular',
    color: '#FFFFFF'
  },
  KEY_MOVE_STEP: 2,
  KEY_SCALE_STEP: 0.02,
  KEY_ROTATE_STEP: 2,
  MIN_FONT_SIZE: 20
};

// Classifica: nuovo stile "Super League" 1080x1350 ricreato nel Canva.
// La geometria dettagliata (colonne, righe, legenda) vive in
// components/ClassificaComp/classificaVariants.js (CLASSIFICA_GEO).
export const CLASSIFICA_LAYOUT = {
  STAGE: {
    WIDTH: 1080,
    HEIGHT: 1350
  },
  // Overlay gradiente scuro sopra la foto (identico ai mockup HTML)
  OVERLAY_STOPS: [
    0, 'rgba(8,9,11,0.8)',
    0.20, 'rgba(8,9,11,0.18)',
    0.34, 'rgba(8,9,11,0.0)',
    0.56, 'rgba(8,9,11,0.8)',
    1, 'rgba(8,9,11,0.95)'
  ],
  BG_FILL: '#08090b',
  HEADER: {
    PAD_TOP: 52,
    LEFT_X: 60,      // logo competizione (super league) allineato a sinistra
    RIGHT_X: 1020,   // logo pagina (CE) allineato a destra
    LEFT_LOGO_H: 112,
    RIGHT_LOGO_H: 100
  },
  COMP_LOGO: '/loghi/superleague.png',   // logo competizione (sinistra)
  PAGE_LOGO: '/loghi/Logo CE bianco.png' // logo pagina (destra)
};
