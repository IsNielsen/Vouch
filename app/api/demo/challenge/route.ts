export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  const res = await fetch(`${origin}/api/vouch/challenge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOUCH_API_KEY}`,
    },
    body: JSON.stringify({
      transaction_context: {
        amount: 2500,
        currency: "USD",
        recipient: "James Chen",
        account_last4: "4821",
      },
    }),
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
