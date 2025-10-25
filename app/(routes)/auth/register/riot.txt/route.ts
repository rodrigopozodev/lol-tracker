export const dynamic = "force-static";

export async function GET() {
  const body = "851b03ff-3318-4840-9f0b-388969b8ecb3";
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}