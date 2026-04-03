import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRpConfig } from "@/lib/webauthn/rp";
import { verifyApiKey } from "@/lib/api-auth";
import { withCors, CORS_PREFLIGHT_HEADERS } from "@/lib/cors";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_PREFLIGHT_HEADERS });
}

// DB: see supabase/migrations/20260331_vouch_challenges.sql

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const apiAuth = await verifyApiKey(req);
  if (!apiAuth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cors = (res: Response) => withCors(res, origin, apiAuth.allowedOrigins);

  let body: { action?: unknown; context?: unknown; transaction_context?: unknown; user_id?: unknown; webhook_url?: unknown };
  try {
    body = await req.json();
  } catch {
    return cors(Response.json({ error: "Invalid JSON body" }, { status: 400 }));
  }

  // Accept transaction_context (spec name) or context (legacy)
  const txContext = body.transaction_context ?? body.context;

  if (typeof body.action !== "string" || !body.action.trim()) {
    return cors(Response.json({ error: "action is required and must be a non-empty string" }, { status: 400 }));
  }
  if (typeof txContext !== "object" || txContext === null || Array.isArray(txContext)) {
    return cors(Response.json({ error: "transaction_context is required and must be a non-empty object" }, { status: 400 }));
  }
  if (Object.keys(txContext as object).length === 0) {
    return cors(Response.json({ error: "transaction_context must not be empty" }, { status: 400 }));
  }
  if (body.webhook_url !== undefined && (typeof body.webhook_url !== "string" || !body.webhook_url.startsWith("https://"))) {
    return cors(Response.json({ error: "webhook_url must be an https URL" }, { status: 400 }));
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
    return cors(Response.json({ error: msg }, { status: 500 }));
  }

  const expiresAt = new Date(Date.now() + 300_000).toISOString();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("vouch_challenges")
    .insert({
      expires_at: expiresAt,
      webauthn_challenge: webauthnOptions.challenge,
      transaction_context: { action: body.action, context: txContext },
      user_id: typeof body.user_id === "string" ? body.user_id : null,
      api_key_hash: apiAuth.keyHash,
      webhook_url: typeof body.webhook_url === "string" ? body.webhook_url : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return cors(Response.json({ error: "Failed to create challenge" }, { status: 500 }));
  }

  return cors(Response.json({
    challenge_id: (data as { id: string }).id,
    webauthn_options: webauthnOptions,
    expires_in: 300,
  }));
}
