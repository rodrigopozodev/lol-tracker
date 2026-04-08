import type { AbilitySlot } from "@/lib/mashups/loadoutData";

const ROWS: AbilitySlot[] = ["Q", "W", "E", "R"];
const MAX_LEVEL = 15;

/**
 * Celdas con el nivel de campeón en el que subes esa habilidad (estilo u.gg / OP.GG).
 */
export function SkillOrderGrid({
  skillLevels,
}: {
  skillLevels: Record<AbilitySlot, number[]>;
}) {
  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

  function levelUpAt(ability: AbilitySlot, champLevel: number): boolean {
    return skillLevels[ability].includes(champLevel);
  }

  return (
    <div className="rounded-xl bg-[#1c1c1c] p-3 lg:p-4">
      <h3 className="mb-3 text-center text-xs font-bold tracking-wide text-white">Orden de habilidades</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[300px] border-collapse">
          <thead>
            <tr>
              <th className="w-9 p-1" />
              {levels.map((lv) => (
                <th key={lv} className="p-1 text-center text-[11px] font-medium text-[#8b7f99]">
                  {lv}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((ab) => (
              <tr key={ab}>
                <td className="p-1 text-center text-sm font-bold text-white">{ab}</td>
                {levels.map((lv) => {
                  const on = levelUpAt(ab, lv);
                  return (
                    <td key={lv} className="p-1 text-center align-middle">
                      {on ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-bold text-white shadow-[0_0_0_1px_rgba(37,99,235,0.4)]">
                          {lv}
                        </span>
                      ) : (
                        <span className="inline-block h-7 w-7 text-[#2d2835]">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
