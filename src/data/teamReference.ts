/**
 * Static enrichment for national teams. football-data.org gives us a name, a
 * trigram (TLA) and a crest URL, but no flag ISO code or kit colors — both of
 * which GroupStage needs (flags for the 2D UI, colors for the procedural 3D
 * jerseys). This table maps FIFA trigrams to a flagcdn ISO code and primary /
 * secondary kit colors. Unknown teams fall back to neutral defaults.
 */
export interface TeamRef {
  flagCode: string;
  primary: string;
  secondary: string;
}

export const TEAM_REFERENCE: Record<string, TeamRef> = {
  ARG: { flagCode: 'ar', primary: '#6C9BD2', secondary: '#ffffff' },
  BRA: { flagCode: 'br', primary: '#fedd00', secondary: '#009739' },
  FRA: { flagCode: 'fr', primary: '#1f3c88', secondary: '#ffffff' },
  ENG: { flagCode: 'gb-eng', primary: '#f4f4f4', secondary: '#cf142b' },
  ESP: { flagCode: 'es', primary: '#c60b1e', secondary: '#f1bf00' },
  GER: { flagCode: 'de', primary: '#1a1a1a', secondary: '#d00000' },
  POR: { flagCode: 'pt', primary: '#da291c', secondary: '#006847' },
  NED: { flagCode: 'nl', primary: '#f36c21', secondary: '#ffffff' },
  BEL: { flagCode: 'be', primary: '#e30613', secondary: '#fdda24' },
  CRO: { flagCode: 'hr', primary: '#d81e05', secondary: '#ffffff' },
  URU: { flagCode: 'uy', primary: '#5ba3d9', secondary: '#ffffff' },
  USA: { flagCode: 'us', primary: '#0a3161', secondary: '#b31942' },
  MEX: { flagCode: 'mx', primary: '#006847', secondary: '#ce1126' },
  CAN: { flagCode: 'ca', primary: '#d52b1e', secondary: '#ffffff' },
  MAR: { flagCode: 'ma', primary: '#c1272d', secondary: '#006233' },
  JPN: { flagCode: 'jp', primary: '#1b2a6b', secondary: '#ffffff' },
  SEN: { flagCode: 'sn', primary: '#00853f', secondary: '#fdef42' },
  ITA: { flagCode: 'it', primary: '#0066b3', secondary: '#ffffff' },
  NGA: { flagCode: 'ng', primary: '#008751', secondary: '#ffffff' },
  GHA: { flagCode: 'gh', primary: '#ce1126', secondary: '#006b3f' },
  CMR: { flagCode: 'cm', primary: '#007a5e', secondary: '#ce1126' },
  CIV: { flagCode: 'ci', primary: '#ff8200', secondary: '#009e60' },
  EGY: { flagCode: 'eg', primary: '#c8102e', secondary: '#ffffff' },
  TUN: { flagCode: 'tn', primary: '#e70013', secondary: '#ffffff' },
  ALG: { flagCode: 'dz', primary: '#006233', secondary: '#ffffff' },
  KOR: { flagCode: 'kr', primary: '#c60c30', secondary: '#003478' },
  KSA: { flagCode: 'sa', primary: '#006c35', secondary: '#ffffff' },
  IRN: { flagCode: 'ir', primary: '#ffffff', secondary: '#239f40' },
  AUS: { flagCode: 'au', primary: '#fcb813', secondary: '#00843d' },
  QAT: { flagCode: 'qa', primary: '#8a1538', secondary: '#ffffff' },
  ECU: { flagCode: 'ec', primary: '#ffd100', secondary: '#0072c6' },
  COL: { flagCode: 'co', primary: '#fcd116', secondary: '#003893' },
  PER: { flagCode: 'pe', primary: '#d91023', secondary: '#ffffff' },
  CHI: { flagCode: 'cl', primary: '#d52b1e', secondary: '#0039a6' },
  PAR: { flagCode: 'py', primary: '#d52b1e', secondary: '#0038a8' },
  SUI: { flagCode: 'ch', primary: '#d52b1e', secondary: '#ffffff' },
  DEN: { flagCode: 'dk', primary: '#c8102e', secondary: '#ffffff' },
  POL: { flagCode: 'pl', primary: '#dc143c', secondary: '#ffffff' },
  SWE: { flagCode: 'se', primary: '#005293', secondary: '#fecb00' },
  SRB: { flagCode: 'rs', primary: '#c6363c', secondary: '#ffffff' },
  WAL: { flagCode: 'gb-wls', primary: '#c8102e', secondary: '#ffffff' },
  SCO: { flagCode: 'gb-sct', primary: '#0065bd', secondary: '#ffffff' },
  AUT: { flagCode: 'at', primary: '#ef3340', secondary: '#ffffff' },
  TUR: { flagCode: 'tr', primary: '#e30a17', secondary: '#ffffff' },
  UKR: { flagCode: 'ua', primary: '#ffd700', secondary: '#0057b7' },
  CRC: { flagCode: 'cr', primary: '#c8102e', secondary: '#002b7f' },
  PAN: { flagCode: 'pa', primary: '#db0000', secondary: '#005293' },
  JAM: { flagCode: 'jm', primary: '#009b3a', secondary: '#fed100' },
  NZL: { flagCode: 'nz', primary: '#f4f4f4', secondary: '#1a1a1a' },
  RSA: { flagCode: 'za', primary: '#007a4d', secondary: '#ffb612' },
  NOR: { flagCode: 'no', primary: '#ba0c2f', secondary: '#00205b' },
  CZE: { flagCode: 'cz', primary: '#d7141a', secondary: '#11457e' },
  HUN: { flagCode: 'hu', primary: '#cd2a3e', secondary: '#436f4d' },
  UZB: { flagCode: 'uz', primary: '#1eb53a', secondary: '#0099b5' },
  JOR: { flagCode: 'jo', primary: '#007a3d', secondary: '#ce1126' },
  IRQ: { flagCode: 'iq', primary: '#007a3d', secondary: '#ffffff' },
  BIH: { flagCode: 'ba', primary: '#002395', secondary: '#fecb00' },
  HAI: { flagCode: 'ht', primary: '#00209f', secondary: '#d21034' },
  CUW: { flagCode: 'cw', primary: '#002b7f', secondary: '#f9d90f' },
  CPV: { flagCode: 'cv', primary: '#003893', secondary: '#cf2027' },
  COD: { flagCode: 'cd', primary: '#007fff', secondary: '#f7d618' },
};

const DEFAULT_REF: TeamRef = {
  flagCode: '',
  primary: '#2a6149',
  secondary: '#d4a437',
};

export function teamRefFor(tla: string | null | undefined): TeamRef {
  if (!tla) return DEFAULT_REF;
  return TEAM_REFERENCE[tla.toUpperCase()] ?? DEFAULT_REF;
}
