/**
 * Partida guardada manualmente desde la tabla de puntuaciones (post-game).
 * Última captura: HieloBazuco#ESP — Briar jungla (equipo 1, victoria).
 */

export type SavedMatchParticipant = {
  summonerName: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gold: number;
};

export type SavedMatchRecord = {
  id: string;
  riotId: string;
  gameMode: string;
  map: string;
  duration: string;
  dateLabel: string;
  result: "victoria" | "derrota";
  team1: { label: string; players: SavedMatchParticipant[]; kills: number; deaths: number; assists: number; gold: number };
  team2: { label: string; players: SavedMatchParticipant[]; kills: number; deaths: number; assists: number; gold: number };
  bans1: string[];
  bans2: string[];
  objectives1: { towers: number; inhibitors: number; dragons: number; heralds: number; barons: number; voidGrubs: number };
  objectives2: { towers: number; inhibitors: number; dragons: number; heralds: number; barons: number; voidGrubs: number };
  note?: string;
};

/** Tabla de puntuaciones (Grieta) — registro manual. Bans no listados en la descripción de la captura. */
export const HIELOBAZUCO_MATCH_RANKED_20260403: SavedMatchRecord = {
  id: "manual-euw-ranked-hielobazuco-briar-scoreboard",
  riotId: "HieloBazuco#ESP",
  gameMode: "Clasificatoria solo/dúo",
  map: "Grieta del invocador",
  duration: "—",
  dateLabel: "03/04/2026",
  result: "victoria",
  team1: {
    label: "Equipo 1 (victoria)",
    kills: 41,
    deaths: 21,
    assists: 46,
    gold: 63520,
    players: [
      { summonerName: "HieloBazuco", championName: "Briar", kills: 14, deaths: 4, assists: 12, cs: 217, gold: 15928 },
      { summonerName: "CODEMAX", championName: "Darius", kills: 9, deaths: 2, assists: 7, cs: 209, gold: 13209 },
      { summonerName: "Awamer", championName: "Sylas", kills: 15, deaths: 4, assists: 12, cs: 171, gold: 14053 },
      { summonerName: "Aegon", championName: "Caitlyn", kills: 3, deaths: 6, assists: 4, cs: 226, gold: 12225 },
      { summonerName: "LastTimeNextDone", championName: "Sona", kills: 0, deaths: 5, assists: 11, cs: 26, gold: 8105 },
    ],
  },
  team2: {
    label: "Equipo 2",
    kills: 21,
    deaths: 41,
    assists: 32,
    gold: 56012,
    players: [
      { summonerName: "Pampa", championName: "Renekton", kills: 7, deaths: 9, assists: 8, cs: 161, gold: 12282 },
      { summonerName: "Er Robin Hood", championName: "Diana", kills: 6, deaths: 10, assists: 9, cs: 225, gold: 13392 },
      { summonerName: "patrick", championName: "Yasuo", kills: 0, deaths: 11, assists: 2, cs: 221, gold: 10005 },
      { summonerName: "10noobkiller10", championName: "Xayah", kills: 8, deaths: 6, assists: 3, cs: 193, gold: 12759 },
      { summonerName: "Thulur", championName: "Nami", kills: 0, deaths: 5, assists: 10, cs: 31, gold: 7574 },
    ],
  },
  bans1: [],
  bans2: [],
  objectives1: { towers: 8, inhibitors: 0, dragons: 0, heralds: 2, barons: 1, voidGrubs: 2 },
  objectives2: { towers: 4, inhibitors: 0, dragons: 0, heralds: 2, barons: 0, voidGrubs: 1 },
  note:
    "Registro desde TABLA DE PUNTUACIONES. Equipo 1: 1 dragón anciano (dragones elementales 0 en captura). Bans no incluidos en el texto de la captura. Duración no incluida.",
};
