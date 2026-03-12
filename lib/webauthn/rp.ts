export function getRpConfig(req: Request) {
  const host = req.headers.get("host") ?? "localhost";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    const expectedHost = new URL(appUrl).host;
    if (host !== expectedHost) {
      throw new Error(
        `WebAuthn host mismatch: expected "${expectedHost}", got "${host}"`
      );
    }
  } else {
    console.warn(
      "NEXT_PUBLIC_APP_URL is not set; skipping WebAuthn host validation (dev mode)"
    );
  }

  const rpID = host.split(":")[0];
  const origin = `${req.headers.get("x-forwarded-proto") ?? "http"}://${host}`;
  const rpName = process.env.NEXT_PUBLIC_WEBAUTHN_RP_NAME ?? "Vouch";
  return { rpID, rpName, origin };
}
