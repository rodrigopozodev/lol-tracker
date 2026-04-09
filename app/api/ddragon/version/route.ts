import { NextResponse } from "next/server";
import { getDdragonCdnVersion } from "@/lib/ddragon/cdnVersion";

/** Para componentes cliente que necesitan la misma versión DD que el servidor. */
export async function GET() {
  const version = await getDdragonCdnVersion();
  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
