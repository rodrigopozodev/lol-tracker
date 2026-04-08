/**
 * Runas y stat shards para UI tipo OP.GG (rejillas completas + selección).
 * Árboles: Data Dragon runesReforged.json.
 * Stat mods: paths perk-images/StatMods/… (Community Dragon / cliente).
 */

export type DdragonRune = {
  id: number;
  key: string;
  icon: string;
  name: string;
};

export type DdragonRuneSlot = {
  runes: DdragonRune[];
};

export type DdragonStyle = {
  id: number;
  key: string;
  name: string;
  icon: string;
  slots: DdragonRuneSlot[];
};

/** Stat shard: id de perk (5001–5013) y path bajo cdn/img/ */
export type StatShardDef = {
  id: number;
  name: string;
  path: string;
};

/**
 * Rejilla 3×3 stat mods (orden tipo OP.GG). Cada fila: una elección; los ids deben coincidir con esa fila.
 * F1: adaptable / AS / AH · F2: adaptable (escalado) / MS / MR · F3: vida / tenacidad / vida (escalado)
 */
export const STAT_SHARD_GRID: StatShardDef[][] = [
  [
    { id: 5008, name: "Fuerza adaptable", path: "perk-images/StatMods/StatModsAdaptiveForceIcon.png" },
    { id: 5005, name: "Velocidad de ataque", path: "perk-images/StatMods/StatModsAttackSpeedIcon.png" },
    { id: 5007, name: "Celeridad de habilidad", path: "perk-images/StatMods/StatModsCDRScalingIcon.png" },
  ],
  [
    {
      id: 5012,
      name: "Fuerza adaptable (escalado)",
      path: "perk-images/StatMods/StatModsAdaptiveForceScalingIcon.png",
    },
    { id: 5010, name: "Velocidad de movimiento", path: "perk-images/StatMods/StatModsMovementSpeedIcon.png" },
    { id: 5003, name: "Resistencia mágica", path: "perk-images/StatMods/StatModsMagicResIcon.png" },
  ],
  [
    { id: 5001, name: "Vida (bonificación)", path: "perk-images/StatMods/StatModsHealthPlusIcon.png" },
    {
      id: 5013,
      name: "Tenacidad y resistencia a ralentizaciones",
      path: "perk-images/StatMods/StatModsTenacityIcon.png",
    },
    { id: 5011, name: "Vida (escalado)", path: "perk-images/StatMods/StatModsHealthScalingIcon.png" },
  ],
];

/** Bonificación de vida plana (alternativa en fila defensa en algunas temporadas). */
export const STAT_SHARD_ALT_HEALTH_FLAT: StatShardDef = {
  id: 5001,
  name: "Vida (bonificación)",
  path: "perk-images/StatMods/StatModsHealthPlusIcon.png",
};

export async function fetchRunesReforged(version: string): Promise<DdragonStyle[]> {
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`,
    { next: { revalidate: 3600 } },
  );
  if (!res.ok) throw new Error(`runesReforged ${res.status}`);
  return res.json() as Promise<DdragonStyle[]>;
}

export function getStyleByKey(styles: DdragonStyle[], key: string): DdragonStyle | undefined {
  return styles.find((s) => s.key === key);
}

/** Filas de árbol principal: keystones + cada fila de slots (Precision, etc.). */
export function primaryTreeRows(style: DdragonStyle): DdragonRune[][] {
  return style.slots.map((slot) => slot.runes);
}

/**
 * Árbol secundario en rejilla 3×3: todas las runas que no son keystones (filas 2–4 del árbol).
 */
export function secondaryTreeGrid(style: DdragonStyle): DdragonRune[] {
  if (style.slots.length <= 1) return [];
  return style.slots.slice(1).flatMap((s) => s.runes);
}
