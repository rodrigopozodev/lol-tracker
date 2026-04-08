import {
  championAbilityIconUrl,
  championSquareUrl,
  spellIconUrl,
} from "@/lib/ddAssets";
import type { AbilitySlot, MashupRuneLoadout } from "@/lib/mashups/loadoutData";
import { fetchRunesReforged } from "@/lib/runes/runeUiData";
import { HIELOBAZUCO_MATCH_RANKED_20260403 } from "@/lib/savedMatches/hielobazuco-ranked-2026-04-03";
import { CountersSynergyPanel } from "./CountersSynergyPanel";
import { ItemBuildPath } from "./ItemBuildPath";
import { SavedMatchReferenceCard } from "./SavedMatchReferenceCard";
import { RuneLoadoutGrid } from "./RuneLoadoutGrid";
import { SkillOrderGrid } from "./SkillOrderGrid";

export async function ChampionLoadoutSection({
  version,
  displayName,
  loadout,
  championSlug,
}: {
  version: string;
  displayName: string;
  loadout: MashupRuneLoadout;
  championSlug?: string;
}) {
  const [s1, s2] = loadout.summoners;
  const styles = await fetchRunesReforged(version);
  const { championKey } = loadout;

  return (
    <div className="mt-8 space-y-4 rounded-2xl border border-purple-500/30 bg-[#0f0a18] p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-4 border-b border-white/10 pb-4">
        <img
          src={championSquareUrl(version, championKey)}
          alt={displayName}
          width={56}
          height={56}
          className="shrink-0 rounded-lg border border-purple-500/40"
        />
        <div>
          <h2 className="text-lg font-semibold text-white">Build de referencia</h2>
          <p className="mt-1 max-w-xl text-xs text-[#8a7a9a]">
            Iconos Data Dragon. Edita{" "}
            <code className="text-purple-400">lib/mashups/loadoutData.ts</code>.
          </p>
        </div>
      </div>

      {/* Fila superior: prioridad + hechizos | orden de habilidades | runas (u.gg) */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,210px)_minmax(260px,1fr)_minmax(0,340px)] lg:items-start">
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-[#1c1c1c] p-3">
            <h3 className="mb-2 text-xs font-bold text-white">Prioridad de habilidades</h3>
            <div className="flex flex-wrap items-center justify-center gap-1">
              {loadout.skillPriorityOrder.map((slot, i) => (
                <span key={`${slot}-${i}`} className="flex items-center gap-1">
                  {i > 0 && <span className="text-[#5c5360]">&gt;</span>}
                  <img
                    src={championAbilityIconUrl(version, championKey, slot as AbilitySlot)}
                    alt={slot}
                    width={40}
                    height={40}
                    className="rounded-md border border-white/10"
                  />
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[#1c1c1c] p-3">
            <h3 className="mb-2 text-xs font-bold text-white">Hechizos</h3>
            <div className="flex justify-center gap-2">
              <img
                src={spellIconUrl(version, s1)}
                alt={s1}
                width={48}
                height={48}
                className="rounded-md border border-white/10"
              />
              <img
                src={spellIconUrl(version, s2)}
                alt={s2}
                width={48}
                height={48}
                className="rounded-md border border-white/10"
              />
            </div>
          </div>
        </div>

        <SkillOrderGrid skillLevels={loadout.skillLevels} />

        <div className="min-w-0">
          <RuneLoadoutGrid styles={styles} loadout={loadout} />
        </div>
      </div>

      {loadout.countersSynergy && (
        <div className="space-y-2">
          <p className="text-[11px] text-[#7a6b8a]">
            Counters / Synergy — edita <code className="text-purple-400">countersSynergy</code>,{" "}
            <code className="text-purple-400">strongAgainstByRole</code> y{" "}
            <code className="text-purple-400">goodSynergyChampions</code> en{" "}
            <code className="text-purple-400">loadoutData.ts</code>
          </p>
          <CountersSynergyPanel
            version={version}
            data={loadout.countersSynergy}
            strongAgainstByRole={loadout.strongAgainstByRole}
            goodSynergyChampions={loadout.goodSynergyChampions}
          />
        </div>
      )}

      {championSlug === "briar" && <SavedMatchReferenceCard match={HIELOBAZUCO_MATCH_RANKED_20260403} />}

      {/* Fila inferior: objetos iniciales + progresión */}
      <ItemBuildPath
        version={version}
        startingItemIds={loadout.startingItemIds}
        coreIds={loadout.itemCoreIds}
        optionalGroups={loadout.itemOptionalGroups}
      />

      {loadout.notes && (
        <p className="text-sm leading-relaxed text-[#B8A9C9]">{loadout.notes}</p>
      )}
    </div>
  );
}
