import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) => (mockCookieStore.has(key) ? { value: mockCookieStore.get(key) } : undefined),
    set: (key: string, value: string) => mockCookieStore.set(key, value),
    delete: (key: string) => mockCookieStore.delete(key),
  }),
}));

vi.mock("@/lib/webauthn/rp", () => ({
  getRpConfig: () => ({ rpID: "localhost", rpName: "Vouch", origin: "http://localhost:3000" }),
}));

const { mockGenerateRegistrationOptions, mockVerifyRegistrationResponse } = vi.hoisted(() => ({
  mockGenerateRegistrationOptions: vi.fn(),
  mockVerifyRegistrationResponse: vi.fn(),
}));
vi.mock("@simplewebauthn/server", () => ({
  generateRegistrationOptions: mockGenerateRegistrationOptions,
  verifyRegistrationResponse: mockVerifyRegistrationResponse,
}));

vi.mock("@simplewebauthn/server/helpers", () => ({
  isoBase64URL: {
    fromBuffer: vi.fn().mockReturnValue("base64url-public-key"),
  },
}));

const chain: Record<string, unknown> = {};
chain.select = vi.fn().mockReturnValue(chain);
chain.eq = vi.fn().mockReturnValue(chain);
chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
chain.insert = vi.fn().mockReturnValue(chain);
chain.update = vi.fn().mockReturnValue(chain);

const mockAdminAuth = {
  admin: {
    getUserById: vi.fn(),
    updateUserById: vi.fn(),
    generateLink: vi.fn(),
  },
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: vi.fn().mockReturnValue(chain), auth: mockAdminAuth }),
}));

const mockGetClaims = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: mockGetClaims } }),
}));

import { POST as startPOST } from "@/app/api/passkey/register/start/route";
import { POST as completePOST } from "@/app/api/passkey/register/complete/route";

const FAKE_OPTIONS = {
  challenge: "base64url-challenge-abc",
  rp: { id: "localhost", name: "Vouch" },
  user: { id: "abc", name: "passkey-user", displayName: "passkey-user" },
  pubKeyCredParams: [],
  timeout: 60000,
};

describe("POST /api/passkey/register/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.clear();
    mockGenerateRegistrationOptions.mockResolvedValue(FAKE_OPTIONS);
  });

  it("returns 200 with webauthn registration options", async () => {
    const req = new Request("http://localhost:3000/api/passkey/register/start", { method: "POST" });
    const res = await startPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.challenge).toBe("base64url-challenge-abc");
  });

  it("sets webauthn_challenge cookie", async () => {
    const req = new Request("http://localhost:3000/api/passkey/register/start", { method: "POST" });
    await startPOST(req);
    expect(mockCookieStore.get("webauthn_challenge")).toBe("base64url-challenge-abc");
  });
});

describe("POST /api/passkey/register/complete", () => {
  const VALID_BODY = {
    id: "cred-id-abc",
    response: { transports: ["internal"] },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.clear();
    mockGetClaims.mockResolvedValue({ data: null, error: null });
    mockVerifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: { id: "cred-id-abc", publicKey: new Uint8Array(32), counter: 0 },
        aaguid: "aaguid-value",
      },
    });
    (chain.insert as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });
  });

  it("returns 400 when no challenge cookie", async () => {
    const req = new Request("http://localhost:3000/api/passkey/register/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await completePOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No challenge");
  });

  it("returns 400 when verifyRegistrationResponse throws", async () => {
    mockCookieStore.set("webauthn_challenge", "base64url-challenge-abc");
    mockVerifyRegistrationResponse.mockRejectedValueOnce(new Error("Bad response"));
    const req = new Request("http://localhost:3000/api/passkey/register/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await completePOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Bad response");
  });

  it("returns 500 when DB insert fails", async () => {
    mockCookieStore.set("webauthn_challenge", "base64url-challenge-abc");
    (chain.insert as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: { message: "DB error" } });
    const req = new Request("http://localhost:3000/api/passkey/register/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await completePOST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns { success: true } when no session (signing context)", async () => {
    mockCookieStore.set("webauthn_challenge", "base64url-challenge-abc");
    const req = new Request("http://localhost:3000/api/passkey/register/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await completePOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns { token_hash } when session exists (main app flow)", async () => {
    mockCookieStore.set("webauthn_challenge", "base64url-challenge-abc");
    mockGetClaims.mockResolvedValue({ data: { claims: { sub: "user-uuid" } }, error: null });
    mockAdminAuth.admin.getUserById.mockResolvedValue({
      data: { user: { email: "user@example.com" } },
    });
    mockAdminAuth.admin.generateLink.mockResolvedValue({
      data: { properties: { hashed_token: "tok_abc123" } },
      error: null,
    });
    const req = new Request("http://localhost:3000/api/passkey/register/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await completePOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token_hash).toBe("tok_abc123");
  });
});
