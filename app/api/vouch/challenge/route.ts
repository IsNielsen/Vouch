import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRpConfig } from "@/lib/webauthn/rp";

// SQL migration required:
// CREATE TABLE vouch_challenges (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   created_at timestamptz NOT NULL DEFAULT now(),
//   expires_at timestamptz NOT NULL,
//   status text NOT NULL DEFAULT 'pending', -- pending | verified | expired
//   webauthn_challenge text NOT NULL,
//   transaction_context jsonb,
//   credential_id text,
//   pqc_signature text,
//   pqc_public_key text,
//   authenticator_data text,
//   ip_address text
// );

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== process.env.VOUCH_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // body is optional
  }

  const { rpID } = getRpConfig(req);
  let webauthnOptions;
  try {
    webauthnOptions = await generateAuthenticationOptions({
      rpID,
      userVerification: "required",
      allowCredentials: [],
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to generate challenge";
    return Response.json({ error: msg }, { status: 500 });
  }

  const expiresAt = new Date(Date.now() + 300_000).toISOString();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vouch_challenges")
    .insert({
      expires_at: expiresAt,
      webauthn_challenge: webauthnOptions.challenge,
      transaction_context: body.transaction_context ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return Response.json({ error: "Failed to create challenge" }, { status: 500 });
  }

  return Response.json({
    challenge_id: (data as { id: string }).id,
    webauthn_options: webauthnOptions,
    expires_in: 300,
  });
}
