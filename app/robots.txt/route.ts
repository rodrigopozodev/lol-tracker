import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Allow: /summoner/",
    "Allow: /policies/",
    "Allow: /ads.txt",
    "",
  ];

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
