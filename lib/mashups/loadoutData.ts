/**
 * Builds recomendados por campeón (mashups). Data Dragon para iconos.
 */

export type AbilitySlot = "Q" | "W" | "E" | "R";

/** Tabla estilo analytics (Counters / Synergy), debajo de runas en el build */
export type CountersSynergyCells = {
  counters: {
    commonMatchup: string;
    strongAgainst: string;
    weakAgainst: string;
  };
  synergy: {
    goodSynergy: string;
    badSynergy: string;
  };
};

/** Strong Against por rol (icono + nombre + win rate + games); Data Dragon `championKey`. */
export type StrongAgainstRoleEntry = {
  championKey: string;
  name: string;
  winRatePct: number;
  /** Partidas (ej. muestra de analytics); por defecto 1 en UI si omites */
  games?: number;
};

export type StrongAgainstByRole = {
  top: StrongAgainstRoleEntry;
  jungle: StrongAgainstRoleEntry;
  mid: StrongAgainstRoleEntry;
  adc: StrongAgainstRoleEntry;
  support: StrongAgainstRoleEntry;
};

/** Good Synergy con iconos (solo Games debajo del icono; sin Win Rate). */
export type SynergyPickEntry = { championKey: string; name: string; games?: number };

export type MashupRuneLoadout = {
  championKey: string;
  summoners: [string, string];
  primaryTreeKey: string;
  secondaryTreeKey: string;
  primarySelectedIds: [number, number, number, number];
  secondarySelectedIds: [number, number];
  statShardIds: [number, number, number];
  /** Orden de prioridad al maxear, ej. W > Q > E */
  skillPriorityOrder: AbilitySlot[];
  /** Niveles de campeón (1–18) en los que se asigna un punto a cada habilidad */
  skillLevels: Record<AbilitySlot, number[]>;
  startingItemIds: number[];
  /** Núcleo en línea (ej. mítico / bota / leyenda) */
  itemCoreIds: number[];
  /** Grupos de alternativas (OR) para slots finales; cada array es un grupo */
  itemOptionalGroups: number[][];
  /** Opcional: tabla Counters / Synergy entre runas y objetos */
  countersSynergy?: CountersSynergyCells;
  /** Strong Against detallado por línea (pestaña Strong Against) */
  strongAgainstByRole?: StrongAgainstByRole;
  /** Good Synergy como campeones con icono (rejilla analytics sin fila Win Rate) */
  goodSynergyChampions?: SynergyPickEntry[];
  notes?: string;
};

const LOADOUTS: Partial<Record<string, MashupRuneLoadout>> = {
  briar: {
    championKey: "Briar",
    summoners: ["SummonerFlash", "SummonerSmite"],
    primaryTreeKey: "Precision",
    secondaryTreeKey: "Domination",
    primarySelectedIds: [8005, 9111, 9104, 8014],
    secondarySelectedIds: [8143, 8135],
    statShardIds: [5008, 5012, 5011],
    skillPriorityOrder: ["W", "Q", "E"],
    skillLevels: {
      Q: [3, 8, 10, 12, 13],
      W: [1, 4, 5, 7, 9],
      E: [2, 14, 15],
      R: [6, 11],
    },
    startingItemIds: [1106],
    itemCoreIds: [3153, 3047, 3071],
    itemOptionalGroups: [
      [6333, 3036],
      [3065, 6333, 3026],
      [3026, 6333, 3065],
    ],
    countersSynergy: {
      counters: {
        commonMatchup: "—",
        strongAgainst: "—",
        weakAgainst: "—",
      },
      synergy: {
        goodSynergy: "—",
        badSynergy: "—",
      },
    },
    notes: "Edita lib/mashups/loadoutData.ts para otro orden de habilidades u objetos.",
  },
  lillia: {
    championKey: "Lillia",
    summoners: ["SummonerFlash", "SummonerSmite"],
    primaryTreeKey: "Sorcery",
    secondaryTreeKey: "Domination",
    primarySelectedIds: [8230, 8226, 8234, 8232],
    secondarySelectedIds: [8139, 8135],
    statShardIds: [5008, 5010, 5011],
    skillPriorityOrder: ["Q", "W", "E"],
    skillLevels: {
      Q: [3, 8, 10, 12, 13],
      W: [1, 4, 5, 7, 9],
      E: [2, 14, 15],
      R: [6, 11],
    },
    startingItemIds: [1106],
    itemCoreIds: [6653, 3020, 3116],
    itemOptionalGroups: [
      [3157, 3102],
      [3089, 3157, 3102],
      [3102, 3089, 3157],
    ],
    countersSynergy: {
      counters: {
        commonMatchup: "—",
        strongAgainst: "—",
        weakAgainst: "—",
      },
      synergy: {
        goodSynergy: "Pyke, Singed",
        badSynergy: "—",
      },
    },
    goodSynergyChampions: [
      { championKey: "Pyke", name: "Pyke", games: 1 },
      { championKey: "Singed", name: "Singed", games: 1 },
    ],
    strongAgainstByRole: {
      top: { championKey: "Garen", name: "Garen", winRatePct: 100, games: 1 },
      jungle: { championKey: "Jax", name: "Jax", winRatePct: 100, games: 1 },
      mid: { championKey: "Ekko", name: "Ekko", winRatePct: 100, games: 1 },
      adc: { championKey: "Ezreal", name: "Ezreal", winRatePct: 100, games: 1 },
      support: { championKey: "Bard", name: "Bard", winRatePct: 100, games: 1 },
    },
    notes: "Build orientativo AP jungla. Ajusta objetos y runas en loadoutData.ts.",
  },
  "xin-zhao": {
    championKey: "XinZhao",
    summoners: ["SummonerFlash", "SummonerSmite"],
    primaryTreeKey: "Precision",
    secondaryTreeKey: "Domination",
    primarySelectedIds: [8010, 9111, 9104, 8014],
    secondarySelectedIds: [8143, 8105],
    statShardIds: [5005, 5010, 5001],
    skillPriorityOrder: ["W", "Q", "E"],
    skillLevels: {
      Q: [2, 8, 10, 12, 14],
      W: [1, 4, 5, 7, 9],
      E: [3, 13, 15],
      R: [6, 11],
    },
    startingItemIds: [1106],
    itemCoreIds: [6631, 3071, 3047],
    itemOptionalGroups: [
      [6333, 3026],
      [3742, 6333],
      [3026, 6333],
    ],
    countersSynergy: {
      counters: {
        commonMatchup: "—",
        strongAgainst: "Vel'Koz (mid o support): mucha movilidad con la E, cierras distancia y lo matas si te colas; sus habilidades son skillshots y eres un problema en teamfights si flanqueas.",
        weakAgainst: "—",
      },
      synergy: {
        goodSynergy: "—",
        badSynergy: "—",
      },
    },
    strongAgainstByRole: {
      top: { championKey: "Garen", name: "Garen", winRatePct: 50, games: 0 },
      jungle: { championKey: "MasterYi", name: "Master Yi", winRatePct: 50, games: 0 },
      mid: { championKey: "Velkoz", name: "Vel'Koz", winRatePct: 58, games: 1 },
      adc: { championKey: "Ezreal", name: "Ezreal", winRatePct: 50, games: 0 },
      support: { championKey: "Velkoz", name: "Vel'Koz", winRatePct: 58, games: 1 },
    },
    notes:
      "Ventaja clara contra Vel'Koz en mid o support: puedes esquivar su combo con la E, enganchas rápido y lo derribas; en teamfight evita quedarte en línea recta y entra desde lateral o con visión.",
  },
};

export function getLoadoutForSlug(slug: string): MashupRuneLoadout | null {
  const k = slug.toLowerCase();
  return LOADOUTS[k] ?? null;
}
