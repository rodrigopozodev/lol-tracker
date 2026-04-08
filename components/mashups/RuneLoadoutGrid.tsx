import { runeIconUrl } from "@/lib/ddAssets";
import type { MashupRuneLoadout } from "@/lib/mashups/loadoutData";
import type { DdragonRune, DdragonStyle } from "@/lib/runes/runeUiData";
import {
  STAT_SHARD_GRID,
  getStyleByKey,
  primaryTreeRows,
  secondaryTreeGrid,
} from "@/lib/runes/runeUiData";

type RuneVariant = "primary" | "secondary" | "statRow1" | "statRow2" | "statRow3";

function ringForVariant(v: RuneVariant, selected: boolean): string {
  if (!selected) return "rounded-full opacity-[0.32] grayscale";
  const base = "rounded-full ring-2 ring-offset-2 ring-offset-[#1c1c1c]";
  switch (v) {
    case "primary":
      return `${base} ring-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.35)]`;
    case "secondary":
      return `${base} ring-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.35)]`;
    case "statRow1":
    case "statRow2":
      return `${base} ring-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.35)]`;
    case "statRow3":
      return `${base} ring-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.35)]`;
    default:
      return base;
  }
}

function RuneIcon({
  path,
  selected,
  alt,
  size = 40,
  variant,
}: {
  path: string;
  selected: boolean;
  alt: string;
  size?: number;
  variant: RuneVariant;
}) {
  return (
    <img
      src={runeIconUrl(path)}
      alt={alt}
      width={size}
      height={size}
      title={alt}
      className={ringForVariant(variant, selected)}
    />
  );
}

function chunkRunes(runes: DdragonRune[], perRow: number): DdragonRune[][] {
  const rows: DdragonRune[][] = [];
  for (let i = 0; i < runes.length; i += perRow) {
    rows.push(runes.slice(i, i + perRow));
  }
  return rows;
}

const statRowVariant: [RuneVariant, RuneVariant, RuneVariant] = ["statRow1", "statRow2", "statRow3"];

export function RuneLoadoutGrid({
  styles,
  loadout,
}: {
  styles: DdragonStyle[];
  loadout: MashupRuneLoadout;
}) {
  const primary = getStyleByKey(styles, loadout.primaryTreeKey);
  const secondary = getStyleByKey(styles, loadout.secondaryTreeKey);
  if (!primary || !secondary) {
    return (
      <p className="text-sm text-amber-200/90">
        No se encontró el árbol de runas &quot;{!primary ? loadout.primaryTreeKey : loadout.secondaryTreeKey}&quot; en Data
        Dragon.
      </p>
    );
  }

  const primaryRows = primaryTreeRows(primary);
  const [kId, p2, p3, p4] = loadout.primarySelectedIds;
  const primaryPicks = [kId, p2, p3, p4];

  const secondaryRunes = secondaryTreeGrid(secondary);
  const secondaryRows = chunkRunes(secondaryRunes, 3);
  const secondaryPick = new Set(loadout.secondarySelectedIds);

  const [s1, s2, s3] = loadout.statShardIds;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-2">
        <div className="rounded-xl bg-[#1c1c1c] p-3 sm:p-3">
          <h3 className="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-white">Runas principales</h3>
          <div className="flex flex-col items-center gap-2.5">
            {primaryRows.map((row, ri) => (
              <div
                key={ri}
                className="flex flex-wrap justify-center gap-1.5"
                style={{ maxWidth: ri === 0 ? "100%" : "10.5rem" }}
              >
                {row.map((rune) => (
                  <RuneIcon
                    key={rune.id}
                    path={rune.icon}
                    alt={rune.name}
                    selected={primaryPicks[ri] === rune.id}
                    size={ri === 0 ? 42 : 36}
                    variant="primary"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-[#1c1c1c] p-3 sm:p-3">
          <h3 className="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-white">Secundario</h3>
          <div className="flex flex-col items-center gap-1.5">
            {secondaryRows.map((row, ri) => (
              <div key={ri} className="flex justify-center gap-1.5">
                {row.map((rune) => (
                  <RuneIcon
                    key={rune.id}
                    path={rune.icon}
                    alt={rune.name}
                    selected={secondaryPick.has(rune.id)}
                    size={36}
                    variant="secondary"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-[#1c1c1c] p-3 sm:p-3">
          <h3 className="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-white">Stat mods</h3>
          <div className="flex flex-col items-center gap-1.5">
            {STAT_SHARD_GRID.map((row, ri) => {
              const pick = [s1, s2, s3][ri];
              const v = statRowVariant[ri];
              return (
                <div key={ri} className="flex justify-center gap-1.5">
                  {row.map((shard) => (
                    <RuneIcon
                      key={`${ri}-${shard.id}-${shard.path}`}
                      path={shard.path}
                      alt={shard.name}
                      selected={pick === shard.id}
                      size={32}
                      variant={v}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
