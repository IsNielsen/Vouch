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

const { mockGenerateAuthenticationOptions, mockVerifyAuthenticationResponse } = vi.hoisted(() => ({
  mockGenerateAuthenticationOptions: vi.fn(),
  mockVerifyAuthenticationResponse: vi.fn(),
}));
vi.mock("@simplewebauthn/server", () => ({
  generateAuthenticationOptions: mockGenerateAuthenticationOptions,
  verifyAuthenticationResponse: mockVerifyAuthenticationResponse,
}));

vi.mock("@simplewebauthn/server/helpers", () => ({
  isoBase64URL: {
    toBuffer: vi.fn().mockReturnValue(Buffer.from("mock-public-key")),
  },
}));

const chain: Record<string, unknown> = {};
chain.select = vi.fn().mockReturnValue(chain);
chain.eq = vi.fn().mockReturnValue(chain);
chain.single = vi.fn();
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

import { POST as startPOST } from "@/app/api/passkey/authenticate/start/route";
import { POST as completePOST } from "@/app/api/passkey/authenticate/complete/route";

const FAKE_OPTIONS = {
  challenge: "base64url-challenge-xyz",
  rpId: "localhost",
  allowCredentials: [],
  userVerification: "required",
  timeout: 60000,
};

const mockPasskey = {
  id: "cred-id-abc",
  public_key: "base64url-public-key",
  counter: 0,
  transports: ["internal"],
  user_id: "user-uuid",
};

const mockAssertion = {
  id: "cred-id-abc",
  rawId: "cred-id-abc",
  type: "public-key",
  response: {
    authenticatorData: "base64url-auth-data",
    clientDataJSON: "base64url-client-data",
    signature: "base64url-signature",
  },
};

describe("POST /api/passkey/authenticate/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.clear();
    mockGenerateAuthenticationOptions.mockResolvedValue(FAKE_OPTIONS);
  });

  it("returns 200 with webauthn authentication options", async () => {
    const req = new Request("http://localhost:3000/api/passkey/authenticate/start", { method: "POST" });
    const res = await startPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.challenge).toBe("base64url-challenge-xyz");
  });

  it("sets webauthn_challenge cookie", async () => {
    const req = new Request("http://localhost:3000/api/passkey/authenticate/start", { method: "POST" });
    await startPOST(req);
    expect(mockCookieStore.get("webauthn_challenge")).toBe("base64url-challenge-xyz");
  });
});

describe("POST /api/passkey/authenticate/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore.clear();
    mockVerifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    });
  });

  it("returns 400 when no challenge cookie", async () => {
    const req = new Request("http://localhost:3000/api/passkey/authenticate/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockAssertion),
    });
    const res = await completePOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No challenge");
  });

  it("returns 404 when passkey not found", async () => {
    mockCookieStore.set("webauthn_challenge", "base64url-challenge-xyz");
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null, error: null });
    const req = new Request("http://localhost:3000/api/passkey/authenticate/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockAssertion),
    });
    const res = await completePOST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Passkey not found");
  });

  it("returns 400 when verifyAuthenticationResponse throws", async () => {
    mockCookieStore.set("webauthn_challenge", "base64url-challenge-xyz");
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockPasskey, error: null });
    mockVerifyAuthenticationResponse.mockRejectedValueOnce(new Error("Invalid signature"));
    const req = new Request("http://localhost:3000/api/passkey/authenticate/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockAssertion),
    });
    const res = await completePOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid signature");
  });

  it("returns 404 when passkey has no user_id (accountless signer)", async () => {
    mockCookieStore.set("webauthn_challenge", "base64url-challenge-xyz");
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { ...mockPasskey, user_id: null },
      error: null,
    });
    const req = new Request("http://localhost:3000/api/passkey/authenticate/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockAssertion),
    });
    const res = await completePOST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("No account linked to this passkey");
  });

  it("returns 200 with token_hash on successful authentication", async () => {
    mockCookieStore.set("webauthn_challenge", "base64url-challenge-xyz");
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockPasskey, error: null });
    mockAdminAuth.admin.getUserById.mockResolvedValue({
      data: { user: { email: "user@example.com" } },
    });
    mockAdminAuth.admin.generateLink.mockResolvedValue({
      data: { properties: { hashed_token: "tok_xyz789" } },
      error: null,
    });
    const req = new Request("http://localhost:3000/api/passkey/authenticate/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockAssertion),
    });
    const res = await completePOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token_hash).toBe("tok_xyz789");
  });
});
