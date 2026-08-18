import { findTeamLogo } from '../../utils/LogoConstants';

// Configurazione delle 5 varianti di classifica in stile "Super League".
// Ogni variante riproduce fedelmente uno dei mockup HTML forniti, ricreato
// nel Canva (Konva). Contiene: titolo, colori d'accento per riga, legenda,
// intervallo di posizioni per il fetch automatico (SET) e i dati di default
// (loghi greci) mostrati all'apertura della pagina.

// --- PALETTE (convertita dagli oklch dei mockup) ---
const GOLD = '#E8BE3C';
const BLUE = '#46B4FF';
const BLUE_T = '#7CC6FF';
const GREEN = '#3CDCA0';
const GREEN_T = '#63E6B4';
const RED = '#EB503C';
const RED_T = '#F26E5A';
const CHAMP = '#466EFF';
const CHAMP_T = '#8098FF';
const ORANGE = '#FF9628';
const ORANGE_T = '#FFAA45';
const NEUTRAL = 'rgba(255,255,255,0.18)';
const WHITE9 = 'rgba(255,255,255,0.9)';
const WHITE = '#FFFFFF';

// rgb "grezzi" per i gradienti di riga
const RGB = {
  GOLD: '232,190,60',
  BLUE: '70,180,255',
  GREEN: '60,220,160',
  RED: '235,80,60',
  CHAMP: '70,110,255',
  ORANGE: '255,150,40'
};

const LOGO_DIR = '/loghi/SuperLeague';

// Elenco squadre (nome mostrato + logo) usato per il ciclo al click.
export const TEAMS = [
  { name: 'Olympiakos', logo: `${LOGO_DIR}/olympiakos.png` },
  { name: 'PAOK', logo: `${LOGO_DIR}/paok.png` },
  { name: 'AEK', logo: `${LOGO_DIR}/aek.png` },
  { name: 'Panathinaikos', logo: `${LOGO_DIR}/panathinaikos.png` },
  { name: 'Aris', logo: `${LOGO_DIR}/aris.png` },
  { name: 'OFI Creta', logo: `${LOGO_DIR}/ofi.png` },
  { name: 'Levadiakos', logo: `${LOGO_DIR}/levadiakos.png` },
  { name: 'Atromitos', logo: `${LOGO_DIR}/atromitos.png` },
  { name: 'Volos', logo: `${LOGO_DIR}/volos.png` },
  { name: 'Asteras Tripolis', logo: `${LOGO_DIR}/asteras.png` },
  { name: 'Kifisia', logo: `${LOGO_DIR}/kifisia.png` },
  { name: 'Panetolikos', logo: `${LOGO_DIR}/panetolikos.png` },
  { name: 'Panserraikos', logo: `${LOGO_DIR}/panseraikos.png` },
  { name: 'AEL Larissa', logo: `${LOGO_DIR}/ael.png` }
];

// Normalizza i nomi restituiti dallo scraping verso i nomi interni.
export const normalizeTeamName = (scrapedName) => {
  const map = {
    'AEK': 'AEK Atene',
    'AEK Athens FC': 'AEK Atene',
    'Olympiacos Piraeus': 'Olympiakos',
    'Olympiacos': 'Olympiakos',
    'Olympiakos': 'Olympiakos',
    'PAOK': 'PAOK',
    'Panathinaikos': 'Panathinaikos',
    'Aris': 'Aris Salonicco',
    'Aris Thessaloniki': 'Aris Salonicco',
    'Volos NFC': 'Volos',
    'Volos': 'Volos',
    'Levadiakos': 'Levadiakos',
    'OFI Crete': 'OFI Creta',
    'OFI': 'OFI Creta',
    'Atromitos': 'Atromitos',
    'Kifisia': 'Kifisia',
    'AEL Larissa': 'AEL Larissa',
    'Panetolikos': 'Panetolikos',
    'Asteras Tripolis': 'Asteras Tripolis',
    'Asteras T.': 'Asteras Tripolis',
    'Panserraikos': 'Panserraikos'
  };
  return map[scrapedName] || scrapedName;
};

// Mappa nome-normalizzato (da normalizeTeamName) -> {name, logo} per il fetch.
export const DISPLAY_MAP = {
  'Olympiakos': TEAMS[0],
  'PAOK': TEAMS[1],
  'AEK Atene': TEAMS[2],
  'Panathinaikos': TEAMS[3],
  'Aris Salonicco': TEAMS[4],
  'OFI Creta': TEAMS[5],
  'Levadiakos': TEAMS[6],
  'Atromitos': TEAMS[7],
  'Volos': TEAMS[8],
  'Asteras Tripolis': TEAMS[9],
  'Kifisia': TEAMS[10],
  'Panetolikos': TEAMS[11],
  'Panserraikos': TEAMS[12],
  'AEL Larissa': TEAMS[13]
};

// Ripulisce un nome grezzo dallo scraping (suffissi/rumore comuni).
const cleanScrapedName = (raw) =>
  String(raw || '')
    .replace(/\bFC\b/gi, '')
    .replace(/\b\d{4}\b/g, '') // anni tipo "1908"
    .replace(/\s{2,}/g, ' ')
    .trim();

// Risolve il nome squadra dello scraping nel {name, logo} corretto.
// Robusto: usa findTeamLogo (molte varianti + match parziale) e riporta al
// nome breve ufficiale della lista TEAMS; fallback su mappa interna e nome pulito.
export const resolveTeam = (scrapedName) => {
  if (!scrapedName) return { name: '', logo: null };

  // 1) Logo robusto → nome breve ufficiale
  const logo = findTeamLogo(scrapedName);
  if (logo) {
    const t = TEAMS.find(team => team.logo === logo);
    if (t) return t;
    return { name: cleanScrapedName(scrapedName), logo };
  }

  // 2) Mappa nomi interni → display
  const internal = normalizeTeamName(scrapedName);
  if (DISPLAY_MAP[internal]) return DISPLAY_MAP[internal];

  // 3) Nessun match: nome pulito, nessun logo (meglio di un logo sbagliato)
  return { name: cleanScrapedName(scrapedName), logo: null };
};

// Helper per costruire una riga di default
const r = (pos, teamIdx, p, w, d, l, gd, pts) => ({
  pos: String(pos),
  name: TEAMS[teamIdx].name,
  logo: TEAMS[teamIdx].logo,
  p: String(p), w: String(w), d: String(d), l: String(l),
  gd, pts: String(pts)
});

// Stili di riga (accento, gradiente, colore posizione, colore punti)
const style = (accent, gradKey, gradOp, gradStop, posColor, ptColor, badge) => ({
  accent,
  gradient: gradKey ? { rgb: RGB[gradKey], op: gradOp, stop: gradStop } : null,
  posColor,
  ptColor,
  badge: badge || null
});

const NOTE = 'V vinte · N pari · P perse · DR diff. reti';

export const VARIANTS = {
  '1-7': {
    label: 'Classifica 1-7',
    title: null,
    titleColor: null,
    rankRange: [1, 7],
    legend: [
      { color: GOLD, label: 'Playoff scudetto' },
      { color: BLUE, label: 'Playoff Europa' }
    ],
    note: NOTE,
    styles: [
      style(GOLD, 'GOLD', 0.2, 0.72, GOLD, GOLD),
      style(GOLD, 'GOLD', 0.13, 0.62, GOLD, WHITE),
      style(GOLD, 'GOLD', 0.13, 0.62, GOLD, WHITE),
      style(GOLD, 'GOLD', 0.13, 0.62, GOLD, WHITE),
      style(BLUE, 'BLUE', 0.15, 0.62, BLUE_T, WHITE),
      style(BLUE, 'BLUE', 0.15, 0.62, BLUE_T, WHITE),
      style(BLUE, 'BLUE', 0.15, 0.62, BLUE_T, WHITE)
    ],
    defaults: [
      r(1, 0, 14, 10, 3, 1, '+21', 33),
      r(2, 1, 14, 9, 3, 2, '+14', 30),
      r(3, 2, 14, 8, 4, 2, '+12', 28),
      r(4, 3, 14, 7, 4, 3, '+9', 25),
      r(5, 4, 14, 6, 4, 4, '+5', 22),
      r(6, 5, 14, 5, 4, 5, '-2', 19),
      r(7, 6, 14, 4, 4, 6, '-5', 16)
    ]
  },

  '8-14': {
    label: 'Classifica 8-14',
    title: null,
    titleColor: null,
    rankRange: [8, 14],
    legend: [
      { color: BLUE, label: 'Playoff Europa' },
      { color: RED, label: 'Playout retrocessione' }
    ],
    note: NOTE,
    styles: [
      style(BLUE, 'BLUE', 0.2, 0.72, BLUE_T, BLUE_T),
      style(RED, 'RED', 0.16, 0.62, RED_T, WHITE),
      style(RED, 'RED', 0.16, 0.62, RED_T, WHITE),
      style(RED, 'RED', 0.16, 0.62, RED_T, WHITE),
      style(RED, 'RED', 0.16, 0.62, RED_T, WHITE),
      style(RED, 'RED', 0.16, 0.62, RED_T, WHITE),
      style(RED, 'RED', 0.16, 0.62, RED_T, WHITE)
    ],
    defaults: [
      r(8, 7, 14, 4, 3, 7, '-4', 15),
      r(9, 8, 14, 3, 5, 6, '-6', 14),
      r(10, 9, 14, 3, 4, 7, '-7', 13),
      r(11, 10, 14, 3, 3, 8, '-9', 12),
      r(12, 11, 14, 2, 4, 8, '-11', 10),
      r(13, 12, 14, 2, 3, 9, '-13', 9),
      r(14, 13, 14, 1, 4, 9, '-15', 7)
    ]
  },

  'scudetto': {
    label: 'Gruppo scudetto',
    title: 'Gruppo scudetto',
    titleColor: CHAMP_T,
    rankRange: [1, 4],
    legend: [
      { color: CHAMP, label: 'Champions League' },
      { color: ORANGE, label: 'Europa League' }
    ],
    note: NOTE,
    styles: [
      style(CHAMP, 'CHAMP', 0.24, 0.72, CHAMP_T, CHAMP_T, 'Campione'),
      style(CHAMP, 'CHAMP', 0.16, 0.62, CHAMP_T, WHITE),
      style(ORANGE, 'ORANGE', 0.18, 0.62, ORANGE_T, WHITE),
      style(ORANGE, 'ORANGE', 0.18, 0.62, ORANGE_T, WHITE)
    ],
    defaults: [
      r(1, 0, 14, 10, 3, 1, '+21', 33),
      r(2, 1, 14, 9, 3, 2, '+14', 30),
      r(3, 2, 14, 8, 4, 2, '+12', 28),
      r(4, 3, 14, 7, 4, 3, '+9', 25)
    ]
  },

  'europa': {
    label: 'Gruppo Europa',
    title: 'Gruppo Europa',
    titleColor: GREEN_T,
    rankRange: [5, 9],
    legend: [
      { color: GREEN, label: 'Conference League' }
    ],
    note: NOTE,
    styles: [
      style(GREEN, 'GREEN', 0.2, 0.72, GREEN_T, GREEN_T),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE)
    ],
    defaults: [
      r(5, 4, 14, 6, 4, 4, '+5', 22),
      r(6, 5, 14, 5, 4, 5, '-2', 19),
      r(7, 6, 14, 4, 4, 6, '-5', 16),
      r(8, 7, 14, 4, 3, 7, '-4', 15),
      r(9, 8, 14, 3, 5, 6, '-6', 14)
    ]
  },

  'retrocessione': {
    label: 'Gruppo retrocessione',
    title: 'Gruppo retrocessione',
    titleColor: RED_T,
    rankRange: [10, 14],
    legend: [
      { color: RED, label: 'Retrocessione' }
    ],
    note: NOTE,
    styles: [
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(RED, 'RED', 0.16, 0.62, RED_T, WHITE),
      style(RED, 'RED', 0.16, 0.62, RED_T, WHITE)
    ],
    defaults: [
      r(10, 9, 14, 3, 4, 7, '-7', 13),
      r(11, 10, 14, 3, 3, 8, '-9', 12),
      r(12, 11, 14, 2, 4, 8, '-11', 10),
      r(13, 12, 14, 2, 3, 9, '-13', 9),
      r(14, 13, 14, 1, 4, 9, '-15', 7)
    ]
  }
};

export const VARIANT_ORDER = ['1-7', '8-14', 'scudetto', 'europa', 'retrocessione'];

// Geometria (coordinate a 1080x1350) condivisa dal Canva.
export const CLASSIFICA_GEO = {
  W: 1080,
  H: 1350,
  CONTENT_LEFT: 60,
  CONTENT_RIGHT: 1020,
  CONTENT_BOTTOM: 1296, // 1350 - 54
  ROW_INDENT: 18,       // border-left 4 + padding-left 14
  // colonne relative all'inizio contenuto riga (CONTENT_LEFT + ROW_INDENT = 78)
  COLS: {
    POS: { x: 0, w: 52, align: 'left' },
    LOGO: { x: 64, w: 46 },
    NAME: { x: 122, w: 420, align: 'left' },
    P: { x: 554, w: 46, align: 'center' },
    W: { x: 612, w: 46, align: 'center' },
    N: { x: 670, w: 46, align: 'center' },
    L: { x: 728, w: 46, align: 'center' },
    GD: { x: 786, w: 66, align: 'center' },
    PTS: { x: 864, w: 78, align: 'right' }
  },
  ROW_FIRST_H: 82,
  ROW_H: 78,
  SEPARATOR_H: 2,
  HEADER_LABEL_H: 26,
  TITLE_H: 34,
  LEGEND_GAP: 22,
  LEGEND_H: 18,
  LOGO_SIZE: 40
};
