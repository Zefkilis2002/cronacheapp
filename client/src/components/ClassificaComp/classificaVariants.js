import { findTeamLogo, TEAM_LOGOS } from '../../utils/LogoConstants';

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

// --- NAZIONALI (Nations League) ---
// Flashscore restituisce i nomi in inglese; qui la resa italiana usata dalle
// grafiche. Negli asset esiste solo il logo della Grecia: per le altre
// nazionali il logo resta null e il Canva disegna la riga senza stemma
// (stesso comportamento già previsto dal template Coppa di Grecia).
const nation = (name, logo = null) => ({ name, logo });

export const NATIONS = {
  'albania': nation('Albania'),
  'andorra': nation('Andorra'),
  'armenia': nation('Armenia'),
  'austria': nation('Austria'),
  'azerbaijan': nation('Azerbaigian'),
  'belarus': nation('Bielorussia'),
  'belgium': nation('Belgio'),
  'bosnia & herzegovina': nation('Bosnia-Erzegovina'),
  'bulgaria': nation('Bulgaria'),
  'croatia': nation('Croazia'),
  'cyprus': nation('Cipro'),
  'czech republic': nation('Rep. Ceca'),
  'denmark': nation('Danimarca'),
  'england': nation('Inghilterra'),
  'estonia': nation('Estonia'),
  'faroe islands': nation('Far Oer'),
  'finland': nation('Finlandia'),
  'france': nation('Francia'),
  'georgia': nation('Georgia'),
  'germany': nation('Germania'),
  'gibraltar': nation('Gibilterra'),
  'greece': nation('Grecia', TEAM_LOGOS.GRECIA),
  'hungary': nation('Ungheria'),
  'iceland': nation('Islanda'),
  'ireland': nation('Irlanda'),
  'israel': nation('Israele'),
  'italy': nation('Italia'),
  'kazakhstan': nation('Kazakistan'),
  'kosovo': nation('Kosovo'),
  'latvia': nation('Lettonia'),
  'liechtenstein': nation('Liechtenstein'),
  'lithuania': nation('Lituania'),
  'luxembourg': nation('Lussemburgo'),
  'malta': nation('Malta'),
  'moldova': nation('Moldavia'),
  'montenegro': nation('Montenegro'),
  'netherlands': nation('Paesi Bassi'),
  'north macedonia': nation('Macedonia del Nord'),
  'northern ireland': nation('Irlanda del Nord'),
  'norway': nation('Norvegia'),
  'poland': nation('Polonia'),
  'portugal': nation('Portogallo'),
  'republic of ireland': nation('Irlanda'),
  'romania': nation('Romania'),
  'san marino': nation('San Marino'),
  'scotland': nation('Scozia'),
  'serbia': nation('Serbia'),
  'slovakia': nation('Slovacchia'),
  'slovenia': nation('Slovenia'),
  'spain': nation('Spagna'),
  'sweden': nation('Svezia'),
  'switzerland': nation('Svizzera'),
  'turkey': nation('Turchia'),
  'ukraine': nation('Ucraina'),
  'wales': nation('Galles')
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

  // 0) Nazionali (Nations League): match esatto, nessuna ambiguità con i club
  const nazionale = NATIONS[String(scrapedName).trim().toLowerCase()];
  if (nazionale) return nazionale;

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

// Helper per una riga "nazionale" a zero (girone non ancora iniziato)
const n = (pos, flashscoreName) => {
  const t = NATIONS[flashscoreName.toLowerCase()] || { name: flashscoreName, logo: null };
  return {
    pos: String(pos), name: t.name, logo: t.logo,
    srcName: flashscoreName, // nome Flashscore: serve alla ricerca web del logo
    p: '0', w: '0', d: '0', l: '0', gd: '0', pts: '0'
  };
};

// Stili di riga (accento, gradiente, colore posizione, colore punti)
const style = (accent, gradKey, gradOp, gradStop, posColor, ptColor, badge) => ({
  accent,
  gradient: gradKey ? { rgb: RGB[gradKey], op: gradOp, stop: gradStop } : null,
  posColor,
  ptColor,
  badge: badge || null
});

const NOTE = 'V vinte · N pari · P perse · DR diff. reti';

// --- SORGENTE DATI PER VARIANTE ---
// `dataKey` indica quale tabella del bundle /api/standings/all alimenta la
// variante. Scudetto, Europa e retrocessione sono stage Flashscore distinti
// (punti e partite proprie): NON si ricavano filtrando per posizione la
// classifica di regular season, per questo hanno `sliceByRank: false` e si
// prendono tutte le righe dello stage. `sliceByRank: true` serve solo dove una
// tabella unica va spezzata (1-7 / 8-14 dalla regular season, prime 16 di 20
// dalla league phase di coppa) e usa `rankRange`.

export const VARIANTS = {
  '1-7': {
    label: 'Classifica 1-7',
    title: null,
    titleColor: null,
    rankRange: [1, 7],
    dataKey: 'regular',
    sliceByRank: true,
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
    dataKey: 'regular',
    sliceByRank: true,
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
    dataKey: 'scudetto',
    sliceByRank: false,
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
    rankRange: [5, 8],
    dataKey: 'europa',
    sliceByRank: false,
    legend: [
      { color: GREEN, label: 'Conference League' }
    ],
    note: NOTE,
    styles: [
      style(GREEN, 'GREEN', 0.2, 0.72, GREEN_T, GREEN_T),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE)
    ],
    defaults: [
      r(5, 4, 14, 6, 4, 4, '+5', 22),
      r(6, 5, 14, 5, 4, 5, '-2', 19),
      r(7, 6, 14, 4, 4, 6, '-5', 16),
      r(8, 7, 14, 4, 3, 7, '-4', 15)
    ]
  },

  'retrocessione': {
    label: 'Gruppo retrocessione',
    title: 'Gruppo retrocessione',
    titleColor: RED_T,
    rankRange: [9, 14],
    dataKey: 'retrocessione',
    sliceByRank: false,
    legend: [
      { color: RED, label: 'Retrocessione' }
    ],
    note: NOTE,
    styles: [
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(RED, 'RED', 0.16, 0.62, RED_T, WHITE),
      style(RED, 'RED', 0.16, 0.62, RED_T, WHITE)
    ],
    defaults: [
      r(9, 8, 14, 3, 5, 6, '-6', 14),
      r(10, 9, 14, 3, 4, 7, '-7', 13),
      r(11, 10, 14, 3, 3, 8, '-9', 12),
      r(12, 11, 14, 2, 4, 8, '-11', 10),
      r(13, 12, 14, 2, 3, 9, '-13', 9),
      r(14, 13, 14, 1, 4, 9, '-15', 7)
    ]
  },

  'nationsleague': {
    label: 'Nations League',
    title: 'Nations League',
    titleColor: CHAMP_T,
    // Il girone della Grecia è un girone a sé dentro lo stage della sua lega:
    // il server lo isola cercando la Grecia fra tutti i gironi di League A/B/C/D,
    // quindi qui si prendono tutte le righe così come arrivano.
    rankRange: [1, 4],
    dataKey: 'nationsleague',
    sliceByRank: false,
    legend: [
      { color: CHAMP, label: 'Quarti di finale' },
      { color: ORANGE, label: 'Spareggio' },
      { color: RED, label: 'Retrocessione' }
    ],
    note: NOTE,
    styles: [
      style(CHAMP, 'CHAMP', 0.24, 0.72, CHAMP_T, CHAMP_T),
      style(CHAMP, 'CHAMP', 0.16, 0.62, CHAMP_T, WHITE),
      style(ORANGE, 'ORANGE', 0.18, 0.62, ORANGE_T, WHITE),
      style(RED, 'RED', 0.16, 0.62, RED_T, WHITE)
    ],
    // Il girone 2026/27 (League A, gruppo 2) non è ancora iniziato: si gioca da
    // settembre 2026, quindi i default sono le quattro nazionali a zero.
    defaults: [
      n(1, 'Germany'),
      n(2, 'Netherlands'),
      n(3, 'Greece'),
      n(4, 'Serbia')
    ]
  },

  'coppa': {
    label: 'Coppa di Grecia',
    layout: 'coppa', // template a pannello laterale, diverso dalle altre 5 varianti
    title: 'Coppa di Grecia',
    titleColor: CHAMP_T,
    rankRange: [1, 16],
    dataKey: 'coppa',
    sliceByRank: true,
    legend: [
      { color: CHAMP, label: 'Quarti di finale' },
      { color: GOLD, label: 'Play-off' }
    ],
    note: NOTE,
    styles: [
      style(CHAMP, 'CHAMP', 0.22, 0.70, CHAMP_T, CHAMP_T),
      style(CHAMP, 'CHAMP', 0.16, 0.62, CHAMP_T, WHITE),
      style(CHAMP, 'CHAMP', 0.16, 0.62, CHAMP_T, WHITE),
      style(CHAMP, 'CHAMP', 0.16, 0.62, CHAMP_T, WHITE),
      style(GOLD, 'GOLD', 0.18, 0.62, GOLD, GOLD),
      style(GOLD, 'GOLD', 0.18, 0.62, GOLD, WHITE),
      style(GOLD, 'GOLD', 0.18, 0.62, GOLD, WHITE),
      style(GOLD, 'GOLD', 0.18, 0.62, GOLD, WHITE),
      style(GOLD, 'GOLD', 0.18, 0.62, GOLD, WHITE),
      style(GOLD, 'GOLD', 0.18, 0.62, GOLD, WHITE),
      style(GOLD, 'GOLD', 0.18, 0.62, GOLD, WHITE),
      style(GOLD, 'GOLD', 0.18, 0.62, GOLD, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE),
      style(NEUTRAL, null, 0, 0, WHITE9, WHITE)
    ],
    defaults: [
      r(1, 0, 6, 5, 1, 0, '+12', 16),
      r(2, 1, 6, 5, 0, 1, '+9', 15),
      r(3, 2, 6, 4, 2, 0, '+8', 14),
      r(4, 3, 6, 4, 1, 1, '+7', 13),
      r(5, 4, 6, 3, 2, 1, '+4', 11),
      r(6, 5, 6, 3, 1, 2, '+2', 10),
      r(7, 6, 6, 3, 1, 2, '+1', 10),
      r(8, 7, 6, 2, 3, 1, '0', 9),
      r(9, 8, 6, 2, 2, 2, '-1', 8),
      r(10, 9, 6, 2, 2, 2, '-2', 8),
      r(11, 10, 6, 2, 1, 3, '-3', 7),
      r(12, 11, 6, 2, 1, 3, '-4', 7),
      r(13, 12, 6, 1, 3, 2, '-5', 6),
      r(14, 13, 6, 1, 2, 3, '-7', 5),
      // Squadre fuori Super League: logo dagli asset locali, con srcName come
      // rete di sicurezza per la ricerca web automatica
      { pos: '15', name: 'Kalamata', logo: findTeamLogo('Kalamata'), srcName: 'Kalamata', p: '6', w: '1', d: '1', l: '4', gd: '-9', pts: '4' },
      { pos: '16', name: 'Athens Kallithea', logo: findTeamLogo('Athens Kallithea'), srcName: 'Athens Kallithea', p: '6', w: '0', d: '2', l: '4', gd: '-12', pts: '2' }
    ]
  }
};

export const VARIANT_ORDER = ['1-7', '8-14', 'scudetto', 'europa', 'retrocessione', 'nationsleague', 'coppa'];

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

// Geometria del template "Coppa di Grecia": pannello laterale (760px),
// contenuto ancorato in ALTO (non in basso come le altre 5 varianti),
// righe piatte (nessuna riga "più grande" per il #1), 16 posizioni.
export const COPPA_GEO = {
  W: 1080,
  H: 1350,
  CONTENT_LEFT: 60,
  CONTENT_TOP: 52,
  // Pannello più stretto di 60px (era 700): la colonna SQUADRA aveva ~160px
  // inutilizzati anche col nome più lungo, le colonne statistiche restano
  // identiche e i distanziamenti fra colonne (8px) sono invariati.
  CONTENT_WIDTH: 640,
  ROW_INDENT: 14, // border-left 4 + padding-left 10
  // colonne relative all'inizio contenuto riga (CONTENT_LEFT + ROW_INDENT = 74)
  COLS: {
    POS: { x: 0, w: 38, align: 'left' },
    LOGO: { x: 46, w: 32 },
    NAME: { x: 86, w: 266, align: 'left' },
    P: { x: 360, w: 32, align: 'center' },
    W: { x: 400, w: 32, align: 'center' },
    N: { x: 440, w: 32, align: 'center' },
    L: { x: 480, w: 32, align: 'center' },
    GD: { x: 520, w: 46, align: 'center' },
    PTS: { x: 574, w: 52, align: 'right' }
  },
  ROW_H: 58, // altezza flat per tutte le righe
  LOGO_SIZE: 28,
  HEADER_LOGO_H: 88,
  TITLE_MARGIN_TOP: 34,
  TITLE_H: 34,
  HEADER_LABEL_H: 24,
  SEPARATOR_H: 2,
  LEGEND_PAD_TOP: 18,
  LEGEND_ROW_GAP: 8,
  DIM_FROM_INDEX: 8, // righe da pos.9 in poi con statistiche più tenui (0.6/0.75)
  // pannello scuro orizzontale sopra la foto (sinistra → trasparente a destra)
  OVERLAY_WIDTH: 700,
  OVERLAY_STOPS: [0, 'rgba(8,9,11,0.94)', 0.62, 'rgba(8,9,11,0.9)', 1, 'rgba(8,9,11,0.0)'],
  // loghi header: entrambi allineati in alto a y=52 (nessun centraggio reciproco)
  HEADER: {
    LEFT_X: 60,
    RIGHT_X: 1020,
    Y: 52,
    LEFT_H: 88,
    RIGHT_H: 92
  }
};
