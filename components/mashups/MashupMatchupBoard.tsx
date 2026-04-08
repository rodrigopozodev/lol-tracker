import { championSquareUrl } from "@/lib/ddAssets";
import type { StrongAgainstByRole, SynergyPickEntry } from "@/lib/mashups/loadoutData";

const ROLE_ORDER: { key: keyof StrongAgainstByRole; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "jungle", label: "Jungla" },
  { key: "mid", label: "Mid" },
  { key: "adc", label: "ADC" },
  { key: "support", label: "Support" },
];

const shell =
  "rounded-md border border-[#2a2633] bg-[#121018] text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

const th =
  "border-b border-[#2a2633] bg-[#0e0c12] px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-[#8b8699] first:rounded-tl last:rounded-tr";

const td =
  "border-b border-[#2a2633] px-2 py-2 align-middle text-[#e8e4f2]";

function formatWinRate(pct: number) {
  return pct.toFixed(2);
}

/** Strong Against: 5 filas; Contra = icono y debajo win rate + games (sin nombre). */
export function StrongAgainstRoleBoard({
  version,
  byRole,
}: {
  version: string;
  byRole: StrongAgainstByRole;
}) {
  return (
    <div className={`${shell} overflow-hidden`}>
      <table className="w-full min-w-[220px] border-collapse text-left">
        <thead>
          <tr>
            <th className={th}>Rol</th>
            <th className={`${th} text-center`}>Contra</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child>td]:border-b-0">
          {ROLE_ORDER.map(({ key, label }) => {
            const e = byRole[key];
            const games = e.games ?? 1;
            return (
              <tr key={key} className="bg-[#121018]">
                <td className={`${td} w-[72px] align-top font-semibold text-[#9b94b0]`}>{label}</td>
                <td className={`${td} align-top`}>
                  <div
                    className="flex flex-col items-center gap-0.5 py-0.5"
                    aria-label={`Rival: ${e.name}`}
                  >
                    <img
                      src={championSquareUrl(version, e.championKey)}
                      alt=""
                      width={48}
                      height={48}
                      className="shrink-0 rounded-[2px] ring-1 ring-black/40"
                    />
                    <span className="tabular-nums text-[11px] font-semibold leading-tight text-emerald-400">
                      {formatWinRate(e.winRatePct)}
                    </span>
                    <span className="tabular-nums text-[10px] leading-tight text-[#c4bdd4]">{games}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Good Synergy: icono y games debajo (sin nombre, sin win rate). */
export function GoodSynergyPartnerBoard({
  version,
  champions,
}: {
  version: string;
  champions: SynergyPickEntry[];
}) {
  if (champions.length === 0) return null;

  return (
    <div className={`${shell} overflow-hidden`}>
      <table className="w-full min-w-[200px] border-collapse text-left">
        <thead>
          <tr>
            <th className={th}>#</th>
            <th className={`${th} text-center`}>Compañero</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child>td]:border-b-0">
          {champions.map((c, i) => {
            const games = c.games ?? 1;
            return (
              <tr key={`${c.championKey}-${c.name}`} className="bg-[#121018]">
                <td className={`${td} w-[40px] align-top font-semibold text-[#9b94b0]`}>{i + 1}</td>
                <td className={`${td} align-top`}>
                  <div
                    className="flex flex-col items-center gap-0.5 py-0.5"
                    aria-label={`Compañero: ${c.name}`}
                  >
                    <img
                      src={championSquareUrl(version, c.championKey)}
                      alt=""
                      width={48}
                      height={48}
                      className="shrink-0 rounded-[2px] ring-1 ring-black/40"
                    />
                    <span className="tabular-nums text-[10px] leading-tight text-[#c4bdd4]">{games}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
