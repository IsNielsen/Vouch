import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCheckRateLimit } = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

import { POST as challengePOST } from "@/app/api/demo/challenge/route";
import { POST as verifyPOST } from "@/app/api/demo/verify/[challengeId]/route";

const params = Promise.resolve({ challengeId: "demo-challenge-uuid" });

describe("POST /api/demo/challenge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue(true);
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockCheckRateLimit.mockResolvedValueOnce(false);
    const req = new Request("http://localhost:3000/api/demo/challenge", { method: "POST" });
    const res = await challengePOST(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/rate limit/i);
  });

  it("returns 200 with challenge_id, webauthn_options, and expires_in", async () => {
    const req = new Request("http://localhost:3000/api/demo/challenge", { method: "POST" });
    const res = await challengePOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.challenge_id).toBe("string");
    expect(body.webauthn_options).toBeDefined();
    expect(body.expires_in).toBe(300);
  });
});

describe("POST /api/demo/verify/[challengeId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue(true);
  });

  it("returns 429 when rate limit exceeded", async () => {
    mockCheckRateLimit.mockResolvedValueOnce(false);
    const req = new Request("http://localhost:3000/api/demo/verify/demo-challenge-uuid", { method: "POST" });
    const res = await verifyPOST(req, { params });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/rate limit/i);
  });

  it("returns 200 with fake PQC receipt", async () => {
    const req = new Request("http://localhost:3000/api/demo/verify/demo-challenge-uuid", { method: "POST" });
    const res = await verifyPOST(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.challenge_id).toBe("demo-challenge-uuid");
    expect(body.pqc_public_key).toMatch(/^pqc_pub_MLDSA/);
    expect(body.pqc_signature).toMatch(/^pqc_sig_MLDSA/);
    expect(body.transaction_verified).toBe(true);
    expect(body.verified_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
