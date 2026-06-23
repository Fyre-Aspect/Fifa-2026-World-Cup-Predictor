/**
 * Curated squad data for the score model. football-data.org's free tier gives
 * us no player ratings, so GroupStage ships a hand-built table of each team's
 * key players: their club, the league that club plays in, and a 0–100 ability
 * rating in the spirit of the public FIFA/Football Manager scales (early 2026).
 *
 * Squad strength (see src/model/squad.ts) is derived from these — the league a
 * player earns his football in is treated as a multiplier on his raw rating,
 * because a 84-rated player tested weekly in the Premier League is a stronger
 * World Cup asset than an 84 in a softer league. Teams without an entry here
 * fall back to an Elo-derived strength, so every side still gets a score.
 */

export type Position = 'GK' | 'DF' | 'MF' | 'FW';

export interface Player {
  name: string;
  position: Position;
  club: string;
  /** Domestic league the club plays in — keyed to LEAGUE_STRENGTH. */
  league: string;
  /** Ability rating, ~70 (squad filler) to ~92 (world class). */
  rating: number;
  /** Recent club form, 0 (poor) to 100 (red hot). Optional nudge. */
  form?: number;
}

/**
 * Six representative players per team — a spine of GK, defence, midfield and
 * attack — enough to characterise squad quality without pretending to be a
 * full 26-man list.
 */
export const SQUADS: Record<string, Player[]> = {
  ARG: [
    { name: 'Emiliano Martínez', position: 'GK', club: 'Aston Villa', league: 'Premier League', rating: 86, form: 78 },
    { name: 'Cristian Romero', position: 'DF', club: 'Tottenham', league: 'Premier League', rating: 85, form: 80 },
    { name: 'Lisandro Martínez', position: 'DF', club: 'Manchester United', league: 'Premier League', rating: 83, form: 72 },
    { name: 'Enzo Fernández', position: 'MF', club: 'Chelsea', league: 'Premier League', rating: 85, form: 82 },
    { name: 'Lionel Messi', position: 'FW', club: 'Inter Miami', league: 'MLS', rating: 88, form: 84 },
    { name: 'Julián Álvarez', position: 'FW', club: 'Atlético Madrid', league: 'La Liga', rating: 86, form: 86 },
  ],
  BRA: [
    { name: 'Alisson', position: 'GK', club: 'Liverpool', league: 'Premier League', rating: 88, form: 82 },
    { name: 'Marquinhos', position: 'DF', club: 'Paris Saint-Germain', league: 'Ligue 1', rating: 85, form: 80 },
    { name: 'Éder Militão', position: 'DF', club: 'Real Madrid', league: 'La Liga', rating: 84, form: 74 },
    { name: 'Bruno Guimarães', position: 'MF', club: 'Newcastle', league: 'Premier League', rating: 85, form: 83 },
    { name: 'Vinícius Júnior', position: 'FW', club: 'Real Madrid', league: 'La Liga', rating: 90, form: 85 },
    { name: 'Rodrygo', position: 'FW', club: 'Real Madrid', league: 'La Liga', rating: 86, form: 81 },
  ],
  FRA: [
    { name: 'Mike Maignan', position: 'GK', club: 'AC Milan', league: 'Serie A', rating: 86, form: 80 },
    { name: 'William Saliba', position: 'DF', club: 'Arsenal', league: 'Premier League', rating: 86, form: 84 },
    { name: 'Theo Hernández', position: 'DF', club: 'AC Milan', league: 'Serie A', rating: 85, form: 78 },
    { name: 'Aurélien Tchouaméni', position: 'MF', club: 'Real Madrid', league: 'La Liga', rating: 85, form: 82 },
    { name: 'Kylian Mbappé', position: 'FW', club: 'Real Madrid', league: 'La Liga', rating: 91, form: 88 },
    { name: 'Ousmane Dembélé', position: 'FW', club: 'Paris Saint-Germain', league: 'Ligue 1', rating: 86, form: 87 },
  ],
  ENG: [
    { name: 'Jordan Pickford', position: 'GK', club: 'Everton', league: 'Premier League', rating: 84, form: 79 },
    { name: 'John Stones', position: 'DF', club: 'Manchester City', league: 'Premier League', rating: 84, form: 76 },
    { name: 'Declan Rice', position: 'MF', club: 'Arsenal', league: 'Premier League', rating: 87, form: 85 },
    { name: 'Jude Bellingham', position: 'MF', club: 'Real Madrid', league: 'La Liga', rating: 89, form: 86 },
    { name: 'Bukayo Saka', position: 'FW', club: 'Arsenal', league: 'Premier League', rating: 87, form: 84 },
    { name: 'Harry Kane', position: 'FW', club: 'Bayern Munich', league: 'Bundesliga', rating: 89, form: 88 },
  ],
  ESP: [
    { name: 'Unai Simón', position: 'GK', club: 'Athletic Bilbao', league: 'La Liga', rating: 84, form: 80 },
    { name: 'Pau Cubarsí', position: 'DF', club: 'Barcelona', league: 'La Liga', rating: 83, form: 83 },
    { name: 'Rodri', position: 'MF', club: 'Manchester City', league: 'Premier League', rating: 90, form: 82 },
    { name: 'Pedri', position: 'MF', club: 'Barcelona', league: 'La Liga', rating: 87, form: 85 },
    { name: 'Lamine Yamal', position: 'FW', club: 'Barcelona', league: 'La Liga', rating: 88, form: 89 },
    { name: 'Nico Williams', position: 'FW', club: 'Athletic Bilbao', league: 'La Liga', rating: 85, form: 84 },
  ],
  POR: [
    { name: 'Diogo Costa', position: 'GK', club: 'Porto', league: 'Primeira Liga', rating: 85, form: 81 },
    { name: 'Rúben Dias', position: 'DF', club: 'Manchester City', league: 'Premier League', rating: 87, form: 83 },
    { name: 'Bernardo Silva', position: 'MF', club: 'Manchester City', league: 'Premier League', rating: 87, form: 82 },
    { name: 'Vitinha', position: 'MF', club: 'Paris Saint-Germain', league: 'Ligue 1', rating: 86, form: 87 },
    { name: 'Rafael Leão', position: 'FW', club: 'AC Milan', league: 'Serie A', rating: 86, form: 83 },
    { name: 'Cristiano Ronaldo', position: 'FW', club: 'Al Nassr', league: 'Saudi Pro League', rating: 84, form: 80 },
  ],
  NED: [
    { name: 'Bart Verbruggen', position: 'GK', club: 'Brighton', league: 'Premier League', rating: 82, form: 78 },
    { name: 'Virgil van Dijk', position: 'DF', club: 'Liverpool', league: 'Premier League', rating: 88, form: 83 },
    { name: 'Frenkie de Jong', position: 'MF', club: 'Barcelona', league: 'La Liga', rating: 87, form: 80 },
    { name: 'Tijjani Reijnders', position: 'MF', club: 'AC Milan', league: 'Serie A', rating: 84, form: 84 },
    { name: 'Cody Gakpo', position: 'FW', club: 'Liverpool', league: 'Premier League', rating: 84, form: 83 },
    { name: 'Memphis Depay', position: 'FW', club: 'Corinthians', league: 'Série A (BRA)', rating: 82, form: 77 },
  ],
  GER: [
    { name: 'Marc-André ter Stegen', position: 'GK', club: 'Barcelona', league: 'La Liga', rating: 86, form: 79 },
    { name: 'Antonio Rüdiger', position: 'DF', club: 'Real Madrid', league: 'La Liga', rating: 86, form: 81 },
    { name: 'Joshua Kimmich', position: 'MF', club: 'Bayern Munich', league: 'Bundesliga', rating: 87, form: 83 },
    { name: 'Florian Wirtz', position: 'MF', club: 'Liverpool', league: 'Premier League', rating: 88, form: 87 },
    { name: 'Jamal Musiala', position: 'MF', club: 'Bayern Munich', league: 'Bundesliga', rating: 88, form: 86 },
    { name: 'Kai Havertz', position: 'FW', club: 'Arsenal', league: 'Premier League', rating: 84, form: 80 },
  ],
  BEL: [
    { name: 'Thibaut Courtois', position: 'GK', club: 'Real Madrid', league: 'La Liga', rating: 89, form: 84 },
    { name: 'Wout Faes', position: 'DF', club: 'Leicester City', league: 'Premier League', rating: 79, form: 72 },
    { name: 'Kevin De Bruyne', position: 'MF', club: 'Napoli', league: 'Serie A', rating: 88, form: 82 },
    { name: 'Youri Tielemans', position: 'MF', club: 'Aston Villa', league: 'Premier League', rating: 83, form: 80 },
    { name: 'Jérémy Doku', position: 'FW', club: 'Manchester City', league: 'Premier League', rating: 84, form: 83 },
    { name: 'Romelu Lukaku', position: 'FW', club: 'Napoli', league: 'Serie A', rating: 84, form: 79 },
  ],
  CRO: [
    { name: 'Dominik Livaković', position: 'GK', club: 'Fenerbahçe', league: 'Süper Lig', rating: 82, form: 77 },
    { name: 'Joško Gvardiol', position: 'DF', club: 'Manchester City', league: 'Premier League', rating: 85, form: 82 },
    { name: 'Luka Modrić', position: 'MF', club: 'AC Milan', league: 'Serie A', rating: 84, form: 78 },
    { name: 'Mateo Kovačić', position: 'MF', club: 'Manchester City', league: 'Premier League', rating: 84, form: 79 },
    { name: 'Andrej Kramarić', position: 'FW', club: 'Hoffenheim', league: 'Bundesliga', rating: 80, form: 75 },
    { name: 'Ante Budimir', position: 'FW', club: 'Osasuna', league: 'La Liga', rating: 79, form: 78 },
  ],
  URU: [
    { name: 'Sergio Rochet', position: 'GK', club: 'Internacional', league: 'Série A (BRA)', rating: 79, form: 75 },
    { name: 'Ronald Araújo', position: 'DF', club: 'Barcelona', league: 'La Liga', rating: 85, form: 78 },
    { name: 'Federico Valverde', position: 'MF', club: 'Real Madrid', league: 'La Liga', rating: 88, form: 86 },
    { name: 'Manuel Ugarte', position: 'MF', club: 'Manchester United', league: 'Premier League', rating: 81, form: 76 },
    { name: 'Darwin Núñez', position: 'FW', club: 'Al Hilal', league: 'Saudi Pro League', rating: 82, form: 78 },
    { name: 'Facundo Pellistri', position: 'FW', club: 'Panathinaikos', league: 'Super League', rating: 77, form: 74 },
  ],
  USA: [
    { name: 'Matt Turner', position: 'GK', club: 'Crystal Palace', league: 'Premier League', rating: 78, form: 70 },
    { name: 'Antonee Robinson', position: 'DF', club: 'Fulham', league: 'Premier League', rating: 81, form: 80 },
    { name: 'Tyler Adams', position: 'MF', club: 'Bournemouth', league: 'Premier League', rating: 80, form: 77 },
    { name: 'Weston McKennie', position: 'MF', club: 'Juventus', league: 'Serie A', rating: 81, form: 79 },
    { name: 'Christian Pulisic', position: 'FW', club: 'AC Milan', league: 'Serie A', rating: 85, form: 84 },
    { name: 'Folarin Balogun', position: 'FW', club: 'Monaco', league: 'Ligue 1', rating: 80, form: 76 },
  ],
  MEX: [
    { name: 'Guillermo Ochoa', position: 'GK', club: 'AVS', league: 'Primeira Liga', rating: 77, form: 70 },
    { name: 'César Montes', position: 'DF', club: 'Almería', league: 'Segunda División', rating: 77, form: 73 },
    { name: 'Edson Álvarez', position: 'MF', club: 'West Ham', league: 'Premier League', rating: 82, form: 78 },
    { name: 'Luis Romo', position: 'MF', club: 'Cruz Azul', league: 'Liga MX', rating: 78, form: 76 },
    { name: 'Hirving Lozano', position: 'FW', club: 'San Diego FC', league: 'MLS', rating: 80, form: 77 },
    { name: 'Santiago Giménez', position: 'FW', club: 'AC Milan', league: 'Serie A', rating: 81, form: 78 },
  ],
  JPN: [
    { name: 'Zion Suzuki', position: 'GK', club: 'Parma', league: 'Serie A', rating: 80, form: 78 },
    { name: 'Ko Itakura', position: 'DF', club: 'Borussia Mönchengladbach', league: 'Bundesliga', rating: 80, form: 77 },
    { name: 'Wataru Endo', position: 'MF', club: 'Liverpool', league: 'Premier League', rating: 80, form: 75 },
    { name: 'Takefusa Kubo', position: 'MF', club: 'Real Sociedad', league: 'La Liga', rating: 83, form: 82 },
    { name: 'Kaoru Mitoma', position: 'FW', club: 'Brighton', league: 'Premier League', rating: 83, form: 83 },
    { name: 'Takumi Minamino', position: 'FW', club: 'Monaco', league: 'Ligue 1', rating: 80, form: 78 },
  ],
  KOR: [
    { name: 'Kim Seung-gyu', position: 'GK', club: 'Al Shabab', league: 'Saudi Pro League', rating: 77, form: 73 },
    { name: 'Kim Min-jae', position: 'DF', club: 'Bayern Munich', league: 'Bundesliga', rating: 85, form: 80 },
    { name: 'Hwang In-beom', position: 'MF', club: 'Feyenoord', league: 'Eredivisie', rating: 79, form: 78 },
    { name: 'Lee Kang-in', position: 'MF', club: 'Paris Saint-Germain', league: 'Ligue 1', rating: 82, form: 80 },
    { name: 'Son Heung-min', position: 'FW', club: 'LAFC', league: 'MLS', rating: 85, form: 82 },
    { name: 'Hwang Hee-chan', position: 'FW', club: 'Wolves', league: 'Premier League', rating: 80, form: 76 },
  ],
  SEN: [
    { name: 'Édouard Mendy', position: 'GK', club: 'Al Ahli', league: 'Saudi Pro League', rating: 82, form: 79 },
    { name: 'Kalidou Koulibaly', position: 'DF', club: 'Al Hilal', league: 'Saudi Pro League', rating: 82, form: 78 },
    { name: 'Pape Matar Sarr', position: 'MF', club: 'Tottenham', league: 'Premier League', rating: 80, form: 79 },
    { name: 'Idrissa Gueye', position: 'MF', club: 'Everton', league: 'Premier League', rating: 79, form: 76 },
    { name: 'Sadio Mané', position: 'FW', club: 'Al Nassr', league: 'Saudi Pro League', rating: 84, form: 80 },
    { name: 'Nicolas Jackson', position: 'FW', club: 'Chelsea', league: 'Premier League', rating: 81, form: 80 },
  ],
  UZB: [
    { name: 'Utkir Yusupov', position: 'GK', club: 'Pakhtakor', league: 'Uzbek Super League', rating: 72, form: 71 },
    { name: 'Abdukodir Khusanov', position: 'DF', club: 'Manchester City', league: 'Premier League', rating: 79, form: 80 },
    { name: 'Rustam Ashurmatov', position: 'DF', club: 'Gwangju FC', league: 'K League', rating: 73, form: 72 },
    { name: 'Jaloliddin Masharipov', position: 'MF', club: 'Pakhtakor', league: 'Uzbek Super League', rating: 74, form: 75 },
    { name: 'Abbosbek Fayzullaev', position: 'MF', club: 'CSKA Moscow', league: 'Russian Premier League', rating: 77, form: 79 },
    { name: 'Eldor Shomurodov', position: 'FW', club: 'Roma', league: 'Serie A', rating: 78, form: 76 },
  ],
};

export function squadFor(teamId: string | null | undefined): Player[] | null {
  if (!teamId) return null;
  return SQUADS[teamId.toUpperCase()] ?? null;
}
