import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRpConfig } from "@/lib/webauthn/rp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = data.claims.sub;

  const admin = createAdminClient();

  const { data: session } = await admin
    .from("document_sessions")
    .select("file_path, status")
    .eq("id", sessionId)
    .single();

  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });
  if (session.status === "signed") return Response.json({ error: "Already signed" }, { status: 409 });

  // Download document and compute SHA-256
  const { data: fileData } = await admin.storage.from("documents").download(session.file_path);
  if (!fileData) return Response.json({ error: "File not found" }, { status: 404 });

  const buffer = await fileData.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const documentHash = Buffer.from(hashBuffer).toString("hex");

  const { rpID } = getRpConfig(req);
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: [],
  });

  const cookieStore = await cookies();
  cookieStore.set(
    `sign_challenge_${sessionId}`,
    JSON.stringify({ challenge: options.challenge, documentHash, userId }),
    { httpOnly: true, sameSite: "strict", path: "/", maxAge: 300 }
  );

  return Response.json(options);
}
