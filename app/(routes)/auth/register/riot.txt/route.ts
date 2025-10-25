export const dynamic = "force-static";

export async function GET() {
  const body = "334d264c-0242-4f55-bf8e-1f1738c86721";
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}