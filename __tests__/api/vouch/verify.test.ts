import { describe, it, expect, vi, beforeEach } from "vitest";

// Chainable mock
const chain: Record<string, unknown> = {};
chain.select = vi.fn().mockReturnValue(chain);
chain.eq = vi.fn().mockReturnValue(chain);
chain.single = vi.fn();
chain.insert = vi.fn().mockReturnValue(chain);
chain.update = vi.fn().mockReturnValue(chain);

const mockFrom = vi.fn().mockReturnValue(chain);

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/api-auth", () => ({
  verifyApiKey: vi.fn().mockImplementation(async (req: Request) => {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token !== "test-api-key") return null;
    return { userId: "user-uuid", keyId: "key-uuid", keyHash: "abc123" };
  }),
}));

const { mockVerifyAuthenticationResponse } = vi.hoisted(() => ({
  mockVerifyAuthenticationResponse: vi.fn(),
}));
vi.mock("@simplewebauthn/server", () => ({
  verifyAuthenticationResponse: mockVerifyAuthenticationResponse,
}));

vi.mock("@simplewebauthn/server/helpers", () => ({
  isoBase64URL: {
    toBuffer: vi.fn().mockReturnValue(Buffer.from("mock-public-key")),
  },
}));

vi.mock("@/lib/webauthn/rp", () => ({
  getRpConfig: () => ({ rpID: "localhost", origin: "http://localhost:3000" }),
}));

vi.mock("@noble/post-quantum/ml-dsa.js", () => ({
  ml_dsa65: {
    keygen: vi.fn().mockReturnValue({
      secretKey: new Uint8Array(32),
      publicKey: new Uint8Array(64),
    }),
    sign: vi.fn().mockReturnValue(new Uint8Array(16)),
  },
}));

process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

import { POST } from "@/app/api/vouch/verify/[challengeId]/route";

const FUTURE = new Date(Date.now() + 300_000).toISOString();
const PAST = new Date(Date.now() - 1000).toISOString();

const mockChallenge = {
  id: "challenge-uuid-123",
  status: "pending",
  expires_at: FUTURE,
  webauthn_challenge: "base64url-challenge-string",
  transaction_context: { amount: 100, currency: "USD" },
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

function makeRequest(body: unknown, authHeader = "Bearer test-api-key") {
  return new Request("http://localhost:3000/api/vouch/verify/challenge-uuid-123", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ challengeId: "challenge-uuid-123" });

describe("POST /api/vouch/verify/[challengeId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    });
  });

  it("returns 401 when Bearer token is missing", async () => {
    const req = makeRequest({ assertion: mockAssertion }, "");
    const res = await POST(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 401 when Bearer token is wrong", async () => {
    const req = makeRequest({ assertion: mockAssertion }, "Bearer bad-key");
    const res = await POST(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when challenge does not exist", async () => {
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null, error: null });
    const req = makeRequest({ assertion: mockAssertion });
    const res = await POST(req, { params });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Challenge not found");
  });

  it("returns 410 when challenge is already used (status != pending)", async () => {
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { ...mockChallenge, status: "verified" },
      error: null,
    });
    const req = makeRequest({ assertion: mockAssertion });
    const res = await POST(req, { params });
    expect(res.status).toBe(410);
  });

  it("returns 410 when challenge is expired", async () => {
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { ...mockChallenge, expires_at: PAST },
      error: null,
    });
    const req = makeRequest({ assertion: mockAssertion });
    const res = await POST(req, { params });
    expect(res.status).toBe(410);
  });

  it("returns 200 with signed receipt on valid request", async () => {
    // challenge found
    (chain.single as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: mockChallenge, error: null })
      // passkey found
      .mockResolvedValueOnce({ data: mockPasskey, error: null });

    // update calls return the chain (no .single needed)
    (chain.update as ReturnType<typeof vi.fn>).mockReturnValue(chain);
    (chain.eq as ReturnType<typeof vi.fn>).mockReturnValue({ ...chain, error: null });

    const req = makeRequest({ assertion: mockAssertion });
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verified).toBe(true);
    expect(body.challenge_id).toBe("challenge-uuid-123");
    expect(body.credential_id).toBe("cred-id-abc");
    expect(body.pqc_signature).toBeDefined();
    expect(body.pqc_public_key).toBeDefined();
    expect(body.transaction_context).toEqual({ amount: 100, currency: "USD" });
  });
});
