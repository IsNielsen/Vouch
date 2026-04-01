import { describe, it, expect, vi, beforeEach } from "vitest";

// Chainable mock builder
const makeChain = (overrides: Record<string, unknown> = {}) => {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  Object.assign(chain, overrides);
  return chain;
};

const chain = makeChain();
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

vi.mock("@simplewebauthn/server", () => ({
  generateAuthenticationOptions: vi.fn().mockResolvedValue({
    challenge: "base64url-challenge-string",
    rpId: "localhost",
    allowCredentials: [],
    userVerification: "required",
    timeout: 60000,
  }),
}));

vi.mock("@/lib/webauthn/rp", () => ({
  getRpConfig: () => ({ rpID: "localhost", origin: "http://localhost:3000" }),
}));


import { POST } from "@/app/api/vouch/challenge/route";
import { GET } from "@/app/api/vouch/challenge/[challengeId]/route";

const VALID_BODY = { action: "verify_payment", transaction_context: { amount: 100, currency: "USD" } };

function makeRequest(opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  return new Request("http://localhost:3000/api/vouch/challenge", {
    method: opts.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...opts.headers,
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

describe("POST /api/vouch/challenge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: insert succeeds and returns an id
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: "challenge-uuid-123" },
      error: null,
    });
  });

  it("returns 401 when Authorization header is missing", async () => {
    const req = makeRequest({ headers: {} });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when Bearer token is wrong", async () => {
    const req = makeRequest({ headers: { Authorization: "Bearer wrong-key" } });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 with challenge_id and webauthn_options on valid request", async () => {
    const req = makeRequest({
      headers: { Authorization: "Bearer test-api-key" },
      body: VALID_BODY,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.challenge_id).toBe("challenge-uuid-123");
    expect(body.webauthn_options).toBeDefined();
    expect(body.webauthn_options.challenge).toBe("base64url-challenge-string");
    expect(body.expires_in).toBe(300);
  });

  it("returns 400 when required fields are missing", async () => {
    const req = new Request("http://localhost:3000/api/vouch/challenge", {
      method: "POST",
      headers: { Authorization: "Bearer test-api-key" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 500 when DB insert fails", async () => {
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });
    const req = makeRequest({ headers: { Authorization: "Bearer test-api-key" }, body: VALID_BODY });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe("GET /api/vouch/challenge/[challengeId]", () => {
  const params = Promise.resolve({ challengeId: "challenge-uuid-123" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when Authorization header is missing", async () => {
    const req = new Request("http://localhost:3000/api/vouch/challenge/challenge-uuid-123");
    const res = await GET(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when challenge does not exist", async () => {
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: null,
      error: null,
    });
    const req = new Request("http://localhost:3000/api/vouch/challenge/challenge-uuid-123", {
      headers: { Authorization: "Bearer test-api-key" },
    });
    const res = await GET(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns 200 with challenge data when found", async () => {
    const mockChallenge = {
      id: "challenge-uuid-123",
      created_at: "2026-03-19T00:00:00Z",
      expires_at: "2026-03-19T00:05:00Z",
      status: "pending",
      transaction_context: { amount: 100 },
      credential_id: null,
      pqc_signature: null,
      pqc_public_key: null,
    };
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockChallenge,
      error: null,
    });
    const req = new Request("http://localhost:3000/api/vouch/challenge/challenge-uuid-123", {
      headers: { Authorization: "Bearer test-api-key" },
    });
    const res = await GET(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("challenge-uuid-123");
    expect(body.status).toBe("pending");
  });
});
