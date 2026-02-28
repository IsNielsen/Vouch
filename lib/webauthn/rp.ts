export function getRpConfig(req: Request) {
  const host = req.headers.get("host") ?? "localhost";
  const rpID = host.split(":")[0];
  const origin = `${req.headers.get("x-forwarded-proto") ?? "http"}://${host}`;
  const rpName = process.env.NEXT_PUBLIC_WEBAUTHN_RP_NAME ?? "Vouch";
  return { rpID, rpName, origin };
}
