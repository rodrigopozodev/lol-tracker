import { NextResponse } from "next/server";

export async function GET() {
  const body = "google.com, pub-7823702362685618, DIRECT, f08c47fec0942fa0";
  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}