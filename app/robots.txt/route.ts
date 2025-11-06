import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const lines = [
    "User-agent: *",
    "Disallow: /auth/",
    "Disallow: /dashboard/",
    "Disallow: /home/",
    "Disallow: /multi-search/",
    "Allow: /about",
    "Allow: /ads.txt",
  ];

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}