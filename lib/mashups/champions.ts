export type MashupChampion = {
  slug: string;
  displayName: string;
};

/** Slugs en minúsculas para URLs */
export const MASHUP_CHAMPIONS: MashupChampion[] = [
  { slug: "ambessa", displayName: "Ambessa" },
  { slug: "viego", displayName: "Viego" },
  { slug: "briar", displayName: "Briar" },
  { slug: "jax", displayName: "Jax" },
  { slug: "lillia", displayName: "Lillia" },
  { slug: "kayn", displayName: "Kayn" },
  { slug: "velkoz", displayName: "Vel'Koz" },
  { slug: "xin-zhao", displayName: "Xin Zhao" },
  { slug: "zaahen", displayName: "Zaahen" },
];

export function getChampionBySlug(slug: string): MashupChampion | undefined {
  return MASHUP_CHAMPIONS.find((c) => c.slug === slug.toLowerCase());
}
