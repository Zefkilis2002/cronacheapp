// src/utils/LogoConstants.js

/**
 * Centralized configuration for team logos.
 * Maps team names to their corresponding logo paths in /public/loghi/
 */

export const LOGO_PATHS = {
    SUPER_LEAGUE: '/loghi/SuperLeague',
    SUPER_LEAGUE_2: '/loghi/SuperLeague2',
    GAMMA_ETHNIKI: '/loghi/GammaEthniki',
    OTHER: '/loghi'
};

/**
 * All available logos categorized for easier access.
 * Keys are somewhat descriptive IDs, values are absolute paths from public root.
 */
export const TEAM_LOGOS = {
    // Super League
    AEK: `${LOGO_PATHS.SUPER_LEAGUE}/aek.png`,
    AEL_LARISSA: `${LOGO_PATHS.SUPER_LEAGUE}/ael.png`,
    ARIS: `${LOGO_PATHS.SUPER_LEAGUE}/aris.png`,
    ASTERAS_TRIPOLIS: `${LOGO_PATHS.SUPER_LEAGUE}/asteras.png`,
    ATROMITOS: `${LOGO_PATHS.SUPER_LEAGUE}/atromitos.png`,
    KIFISIA: `${LOGO_PATHS.SUPER_LEAGUE}/kifisia.png`,
    LEVADIAKOS: `${LOGO_PATHS.SUPER_LEAGUE}/levadiakos.png`,
    OFI_CRETE: `${LOGO_PATHS.SUPER_LEAGUE}/ofi.png`,
    OLYMPIAKOS: `${LOGO_PATHS.SUPER_LEAGUE}/olympiakos.png`,
    PANATHINAIKOS: `${LOGO_PATHS.SUPER_LEAGUE}/panathinaikos.png`,
    PANETOLIKOS: `${LOGO_PATHS.SUPER_LEAGUE}/panetolikos.png`,
    PANSERRAIKOS: `${LOGO_PATHS.SUPER_LEAGUE}/panseraikos.png`,
    PAOK: `${LOGO_PATHS.SUPER_LEAGUE}/paok.png`,
    VOLOS: `${LOGO_PATHS.SUPER_LEAGUE}/volos.png`,

    // Super League 2
    CHRISOUPOLIS: `${LOGO_PATHS.SUPER_LEAGUE_2}/chrisoupolis.png`,
    EGALEO: `${LOGO_PATHS.SUPER_LEAGUE_2}/egaleo.png`,
    GIANNINA: `${LOGO_PATHS.SUPER_LEAGUE_2}/giannina.png`,
    HELLAS_SYROU: `${LOGO_PATHS.SUPER_LEAGUE_2}/hellas_syrou.png`,
    ILIOUPOLI: `${LOGO_PATHS.SUPER_LEAGUE_2}/ilioupoli.png`,
    IRAKLIS: `${LOGO_PATHS.SUPER_LEAGUE_2}/iraklis.png`,
    KALAMATA: `${LOGO_PATHS.SUPER_LEAGUE_2}/kalamata.png`,
    KALLITHEA: `${LOGO_PATHS.SUPER_LEAGUE_2}/kallithea.png`,
    KAMPANIAKOS: `${LOGO_PATHS.SUPER_LEAGUE_2}/kampaniakos.png`,
    KARDITSA: `${LOGO_PATHS.SUPER_LEAGUE_2}/karditsa.png`,
    KAVALA: `${LOGO_PATHS.SUPER_LEAGUE_2}/kavala.png`,
    MARKO: `${LOGO_PATHS.SUPER_LEAGUE_2}/marko.png`,
    NIKI_VOLOU: `${LOGO_PATHS.SUPER_LEAGUE_2}/niki_volou.png`,
    PANIONIOS: `${LOGO_PATHS.SUPER_LEAGUE_2}/panionios.png`,

    // Gamma Ethniki
    ARIS_PETROUPOLIS: `${LOGO_PATHS.GAMMA_ETHNIKI}/aris_petroupolis.png`,
    DOXA_DRAMAS: `${LOGO_PATHS.GAMMA_ETHNIKI}/doxa_dramas.png`,
    ELASSONA: `${LOGO_PATHS.GAMMA_ETHNIKI}/elassona.png`,
    ETHNIKOS_PIREAS: `${LOGO_PATHS.GAMMA_ETHNIKI}/ethnikos_pireas.png`,
    IONIKOS: `${LOGO_PATHS.GAMMA_ETHNIKI}/ionikos.png`,
    KALAMARIA: `${LOGO_PATHS.GAMMA_ETHNIKI}/Kalamaria.png`,
    LAMIA: `${LOGO_PATHS.GAMMA_ETHNIKI}/lamia.png`, // User instructed this location (usually SL)
    PANAHAIKI: `${LOGO_PATHS.GAMMA_ETHNIKI}/panahaiki.png`,
    PANTHRAKIKOS: `${LOGO_PATHS.GAMMA_ETHNIKI}/panthrakikos.png`,
    PIRGOS: `${LOGO_PATHS.GAMMA_ETHNIKI}/pirgos.png`,
    TRIKALA: `${LOGO_PATHS.GAMMA_ETHNIKI}/trikala.png`,
    ZAKHINTOS: `${LOGO_PATHS.GAMMA_ETHNIKI}/zakhintos.png`,

    // Other
    GRECIA: `${LOGO_PATHS.OTHER}/grecia.png`
};

/**
 * Array of all logos for dropdowns or iteration.
 */
export const ALL_LOGOS = Object.values(TEAM_LOGOS);

/**
 * Mapping from team names (including variations and lowercase) to logo paths.
 * Used for looking up logos from Flashscore data or user input.
 */
export const TEAM_NAME_MAP = {
    // Super League
    'aek': TEAM_LOGOS.AEK,
    'aek athens': TEAM_LOGOS.AEK,
    'aek atene': TEAM_LOGOS.AEK,
    'ael': TEAM_LOGOS.AEL_LARISSA,
    'ael larissa': TEAM_LOGOS.AEL_LARISSA,
    'aris': TEAM_LOGOS.ARIS,
    'aris salonicco': TEAM_LOGOS.ARIS,
    'aris thessaloniki': TEAM_LOGOS.ARIS,
    'asteras': TEAM_LOGOS.ASTERAS_TRIPOLIS,
    'asteras tripolis': TEAM_LOGOS.ASTERAS_TRIPOLIS,
    'asteras t.': TEAM_LOGOS.ASTERAS_TRIPOLIS,
    'atromitos': TEAM_LOGOS.ATROMITOS,
    'kifisia': TEAM_LOGOS.KIFISIA,
    'levadiakos': TEAM_LOGOS.LEVADIAKOS,
    'ofi': TEAM_LOGOS.OFI_CRETE,
    'ofi crete': TEAM_LOGOS.OFI_CRETE,
    'ofi creta': TEAM_LOGOS.OFI_CRETE,
    'olympiakos': TEAM_LOGOS.OLYMPIAKOS,
    'olympiacos': TEAM_LOGOS.OLYMPIAKOS,
    'olympiacos piraeus': TEAM_LOGOS.OLYMPIAKOS,
    'panathinaikos': TEAM_LOGOS.PANATHINAIKOS,
    'panetolikos': TEAM_LOGOS.PANETOLIKOS,
    'panserraikos': TEAM_LOGOS.PANSERRAIKOS,
    'paok': TEAM_LOGOS.PAOK,
    'volos': TEAM_LOGOS.VOLOS,
    'volos nfc': TEAM_LOGOS.VOLOS,

    // Super League 2
    'chrisoupolis': TEAM_LOGOS.CHRISOUPOLIS,
    'egaleo': TEAM_LOGOS.EGALEO,
    'giannina': TEAM_LOGOS.GIANNINA,
    'pas giannina': TEAM_LOGOS.GIANNINA,
    'hellas syrou': TEAM_LOGOS.HELLAS_SYROU,
    'ilioupoli': TEAM_LOGOS.ILIOUPOLI,
    'iraklis': TEAM_LOGOS.IRAKLIS,
    'kalamata': TEAM_LOGOS.KALAMATA,
    'kallithea': TEAM_LOGOS.KALLITHEA,
    'athens kallithea': TEAM_LOGOS.KALLITHEA,
    'athens kallithea fc': TEAM_LOGOS.KALLITHEA,
    'kampaniakos': TEAM_LOGOS.KAMPANIAKOS,
    'karditsa': TEAM_LOGOS.KARDITSA,
    'anagennisi karditsas': TEAM_LOGOS.KARDITSA, // Common Flashscore name
    'kavala': TEAM_LOGOS.KAVALA,
    'marko': TEAM_LOGOS.MARKO,
    'niki volou': TEAM_LOGOS.NIKI_VOLOU,
    'niki volos': TEAM_LOGOS.NIKI_VOLOU,
    'panionios': TEAM_LOGOS.PANIONIOS,

    // Gamma Ethniki & Others
    'aris petroupolis': TEAM_LOGOS.ARIS_PETROUPOLIS,
    'doxa dramas': TEAM_LOGOS.DOXA_DRAMAS,
    'elassona': TEAM_LOGOS.ELASSONA,
    'ethnikos pireas': TEAM_LOGOS.ETHNIKOS_PIREAS,
    'ionikos': TEAM_LOGOS.IONIKOS,
    'kalamaria': TEAM_LOGOS.KALAMARIA,
    'apollon pontou': TEAM_LOGOS.KALAMARIA, // Often associated
    'lamia': TEAM_LOGOS.LAMIA,
    'panahaiki': TEAM_LOGOS.PANAHAIKI,
    'panthrakikos': TEAM_LOGOS.PANTHRAKIKOS,
    'pirgos': TEAM_LOGOS.PIRGOS,
    'paniliakos': TEAM_LOGOS.PIRGOS, // Guessing
    'trikala': TEAM_LOGOS.TRIKALA,
    'zakhintos': TEAM_LOGOS.ZAKHINTOS,
    'zakynthos': TEAM_LOGOS.ZAKHINTOS,

    'grecia': TEAM_LOGOS.GRECIA
};

/**
 * Helper to find a logo given a team name.
 * Performs trimming, lowercasing, and partial matching if exact match fails.
 * @param {string} teamName - The name of the team to search for.
 * @returns {string|null} - The path to the logo, or null if not found.
 */
export const findTeamLogo = (teamName) => {
    if (!teamName) return null;
    const lower = teamName.toLowerCase().trim();

    // 1. Exact match (fast)
    if (TEAM_NAME_MAP[lower]) {
        return TEAM_NAME_MAP[lower];
    }

    // 2. Partial match (slower, but helpful for variations)
    // We search the map keys to see if the key is contained in the input name
    // or if the input name is contained in the key.
    // We prioritize longer keys to avoid false positives (e.g. "aek" inside "paek")

    // Sort keys by length descending to match specific names first
    const keys = Object.keys(TEAM_NAME_MAP).sort((a, b) => b.length - a.length);

    for (const key of keys) {
        if (lower === key || lower.includes(key) || key.includes(lower)) {
            // Additional safety: if key is very short (<4 chars), require exact match or word boundary
            if (key.length < 4) {
                if (lower === key) return TEAM_NAME_MAP[key];
                continue;
            }
            return TEAM_NAME_MAP[key];
        }
    }

    return null;
};
