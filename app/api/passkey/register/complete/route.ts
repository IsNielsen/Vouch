import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRpConfig } from "@/lib/webauthn/rp";
import { CORS_PREFLIGHT_HEADERS } from "@/lib/cors";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_PREFLIGHT_HEADERS });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const challenge = cookieStore.get("webauthn_challenge")?.value;
  if (!challenge) return Response.json({ error: "No challenge" }, { status: 400 });

  cookieStore.delete("webauthn_challenge");

  const body = await req.json();
  const { rpID, origin } = getRpConfig(req);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Verification error";
    return Response.json({ error: msg }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return Response.json({ error: "Verification failed" }, { status: 400 });
  }

  const { credential, aaguid } = verification.registrationInfo;
  const admin = createAdminClient();

  // Check if there's an existing session (main app flow via signInAnonymously)
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getClaims();

  let userId: string | null = null;
  let tokenHash: string | undefined;

  if (sessionData?.claims) {
    // Main app: link passkey to existing anonymous session user
    userId = sessionData.claims.sub;
  } else {
    // Signing context: no user account needed
    userId = null;
  }

  const { error: pkError } = await admin.from("passkeys").insert({
    id: credential.id,
    user_id: userId,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    aaguid,
    transports: body.response.transports ?? null,
  });

  if (pkError) {
    return Response.json({ error: pkError.message }, { status: 500 });
  }

  // Generate session token only for main app flow (userId present)
  if (userId) {
    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const email = userData.user?.email ?? `uid-${userId}@vouch.internal`;

    if (!userData.user?.email) {
      await admin.auth.admin.updateUserById(userId, { email, email_confirm: true });
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !linkData.properties?.hashed_token) {
      return Response.json({ error: linkError?.message ?? "Link generation failed" }, { status: 500 });
    }

    tokenHash = linkData.properties.hashed_token;
  }

  return Response.json(tokenHash ? { token_hash: tokenHash } : { success: true });
}
