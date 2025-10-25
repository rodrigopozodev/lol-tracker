export const dynamic = "force-static";

export async function GET() {
  const body = "74a5b14d-e20b-4ff9-85c1-17fa41397e06";
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}