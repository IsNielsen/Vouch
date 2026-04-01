import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRpConfig } from "@/lib/webauthn/rp";

// DB: see supabase/migrations/20260331_vouch_challenges.sql

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== process.env.VOUCH_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: unknown; context?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.action !== "string" || !body.action.trim()) {
    return Response.json({ error: "action is required and must be a non-empty string" }, { status: 400 });
  }
  if (typeof body.context !== "object" || body.context === null || Array.isArray(body.context)) {
    return Response.json({ error: "context is required and must be a non-empty object" }, { status: 400 });
  }
  if (Object.keys(body.context as object).length === 0) {
    return Response.json({ error: "context must not be empty" }, { status: 400 });
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
      transaction_context: { action: body.action, context: body.context },
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
