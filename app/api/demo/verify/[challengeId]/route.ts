export async function POST(
  req: Request,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  const { challengeId } = await params;
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const body = await req.text();

  const res = await fetch(`${origin}/api/vouch/verify/${challengeId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOUCH_API_KEY}`,
    },
    body,
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
