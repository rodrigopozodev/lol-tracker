import { NextResponse } from "next/server";
import { getHomeRefreshJob, startHomeRefreshJob } from "@/lib/homeRefreshJob";

export const dynamic = "force-dynamic";
/** La petición solo encola trabajo; no debe esperar al refresco. */
export const maxDuration = 30;

export async function GET() {
  return NextResponse.json(getHomeRefreshJob());
}

export async function POST() {
  const { alreadyRunning } = startHomeRefreshJob();
  return NextResponse.json(
    { accepted: true, alreadyRunning },
    { status: 202 }
  );
}
