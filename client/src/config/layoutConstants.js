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

export const CLASSIFICA_LAYOUT = {
  STAGE: {
    WIDTH: 2000,
    HEIGHT: 2500,
    BORDER: {
      X: 0,
      Y: 0,
      WIDTH: 2000,
      HEIGHT: 2500,
      STROKE_WIDTH: 5,
      STROKE: 'white'
    }
  },
  ROW_Y: [1460, 1605, 1741, 1886, 2026, 2165, 2310],
  COL_X: {
    TEAM_NAME: 476,
    P: 1090,
    W: 1220,
    D: 1334,
    L: 1458,
    GD: 1595,
    PTS: 1746
  },
  FONT_SPECS: {
    TEAM_NAME: { family: 'Pretendard-ExtraBold', size: 70 },
    STATS: { family: 'Poppins-Medium', size: 68 },
    PTS: { family: 'Poppins-ExtraBold', size: 68 }
  },
  LOGO: {
    size: 90,
    padding: 45
  }
};
