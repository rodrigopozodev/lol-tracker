import { itemIconUrl } from "@/lib/ddAssets";

function ItemImg({
  version,
  id,
  size = 40,
}: {
  version: string;
  id: number;
  size?: number;
}) {
  return (
    <img
      src={itemIconUrl(version, id)}
      alt={`Item ${id}`}
      width={size}
      height={size}
      className="rounded-md border border-white/10 bg-black/30"
    />
  );
}

export function ItemBuildPath({
  version,
  startingItemIds,
  coreIds,
  optionalGroups,
}: {
  version: string;
  startingItemIds: number[];
  coreIds: number[];
  optionalGroups: number[][];
}) {
  return (
    <div className="rounded-xl bg-[#1c1c1c] p-4">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {startingItemIds.length > 0 && (
          <div className="shrink-0 lg:max-w-[140px]">
            <h3 className="mb-3 text-xs font-bold text-white">Objetos iniciales</h3>
            <div className="flex flex-wrap gap-2">
              {startingItemIds.map((id) => (
                <ItemImg key={id} version={version} id={id} size={44} />
              ))}
            </div>
          </div>
        )}

        <div
          className={`min-w-0 flex-1 ${startingItemIds.length > 0 ? "lg:border-l lg:border-white/10 lg:pl-8" : ""}`}
        >
          <h3 className="mb-3 text-xs font-bold text-white">Build de objetos</h3>
          <div className="flex flex-col gap-4 text-sm text-[#B8A9C9]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-[#8a7a9a]">Núcleo</span>
              {coreIds.map((id, i) => (
                <span key={id} className="flex items-center gap-2">
                  {i > 0 && <span className="text-[#5c5360]">&gt;</span>}
                  <ItemImg version={version} id={id} />
                </span>
              ))}
            </div>
            {optionalGroups.map((group, gi) => (
              <div key={gi} className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wide text-[#8a7a9a]">
                  Objeto {coreIds.length + gi + 1}
                </span>
                {group.map((id, ii) => (
                  <span key={`${gi}-${id}-${ii}`} className="flex items-center gap-2">
                    {ii > 0 && <span className="text-[#6b9fe0]">o</span>}
                    <ItemImg version={version} id={id} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
