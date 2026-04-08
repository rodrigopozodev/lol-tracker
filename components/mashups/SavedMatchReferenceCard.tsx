import type { SavedMatchRecord } from "@/lib/savedMatches/hielobazuco-ranked-2026-04-03";

function TeamTable({
  title,
  team,
}: {
  title: string;
  team: SavedMatchRecord["team1"];
}) {
  return (
    <div className="overflow-x-auto">
      <h4 className="mb-2 text-xs font-semibold text-[#B8A9C9]">{title}</h4>
      <p className="mb-2 text-[11px] text-[#8a7a9a]">
        K/D/A equipo: {team.kills} / {team.deaths} / {team.assists} — oro total: {team.gold.toLocaleString("es-ES")}
      </p>
      <table className="w-full min-w-[480px] border-collapse text-left text-[11px] text-[#dce8ea]">
        <thead>
          <tr className="border-b border-white/10 text-[#8a7a9a]">
            <th className="py-1 pr-2">Invocador</th>
            <th className="py-1 pr-2">Campeón</th>
            <th className="py-1 pr-2">K/D/A</th>
            <th className="py-1 pr-2">CS</th>
            <th className="py-1">Oro</th>
          </tr>
        </thead>
        <tbody>
          {team.players.map((p) => (
            <tr key={p.summonerName + p.championName} className="border-b border-white/5">
              <td className="py-1.5 pr-2">{p.summonerName}</td>
              <td className="py-1.5 pr-2">{p.championName}</td>
              <td className="py-1.5 pr-2">
                {p.kills}/{p.deaths}/{p.assists}
              </td>
              <td className="py-1.5 pr-2">{p.cs}</td>
              <td className="py-1.5">{p.gold.toLocaleString("es-ES")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SavedMatchReferenceCard({ match }: { match: SavedMatchRecord }) {
  return (
    <div className="mt-6 rounded-2xl border border-cyan-500/25 bg-[#0a1520] p-4 sm:p-5">
      <h3 className="text-base font-semibold text-cyan-100/95">Partida registrada — {match.riotId}</h3>
      <p className="mt-1 text-xs text-[#7a9aaa]">
        {match.gameMode} · {match.map} · {match.duration} · {match.dateLabel} ·{" "}
        <span className="text-emerald-400">{match.result}</span>
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-[#6a8a9a]">{match.note}</p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <TeamTable title={match.team1.label} team={match.team1} />
        <TeamTable title={match.team2.label} team={match.team2} />
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-[#8a9aaa]">
        <div>
          <span className="font-medium text-[#B8A9C9]">Bans (equipo 1):</span>{" "}
          {match.bans1.length ? match.bans1.join(", ") : "—"}
        </div>
        <div>
          <span className="font-medium text-[#B8A9C9]">Bans (equipo 2):</span>{" "}
          {match.bans2.length ? match.bans2.join(", ") : "—"}
        </div>
      </div>
      <div className="mt-2 grid gap-2 text-[11px] text-[#8a9aaa] sm:grid-cols-2">
        <div>
          Objetivos eq.1: torres {match.objectives1.towers}, inhibs {match.objectives1.inhibitors}, dragones{" "}
          {match.objectives1.dragons}, heraldos {match.objectives1.heralds}, barón {match.objectives1.barons}, void{" "}
          {match.objectives1.voidGrubs}
        </div>
        <div>
          Objetivos eq.2: torres {match.objectives2.towers}, inhibs {match.objectives2.inhibitors}, dragones{" "}
          {match.objectives2.dragons}, heraldos {match.objectives2.heralds}, barón {match.objectives2.barons}, void{" "}
          {match.objectives2.voidGrubs}
        </div>
      </div>
    </div>
  );
}
