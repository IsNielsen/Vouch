import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireBillingAccess } = vi.hoisted(() => ({
  mockRequireBillingAccess: vi.fn(),
}));

const mockGetClaims = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: mockGetClaims } }),
}));

vi.mock("@/lib/billing", () => ({
  requireBillingAccess: mockRequireBillingAccess,
}));

const chain: Record<string, unknown> = {};
chain.select = vi.fn().mockReturnValue(chain);
chain.single = vi.fn();
chain.insert = vi.fn().mockReturnValue(chain);

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: vi.fn().mockReturnValue(chain) }),
}));

import { POST } from "@/app/api/v1/keys/route";

function makeRequest(body?: unknown) {
  return new Request("http://localhost:3000/api/v1/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/v1/keys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (chain.insert as ReturnType<typeof vi.fn>).mockReturnValue(chain);
    (chain.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: "new-key-id" }, error: null });
    mockRequireBillingAccess.mockResolvedValue({ ok: true });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetClaims.mockResolvedValue({ data: null, error: null });
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 with a vouch_sk_ key and default name", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: { sub: "user-uuid" } }, error: null });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.key).toMatch(/^vouch_sk_[0-9a-f]{64}$/);
    expect(body.name).toBe("Default");
  });

  it("uses custom name from request body", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: { sub: "user-uuid" } }, error: null });
    const res = await POST(makeRequest({ name: "My App Key" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("My App Key");
  });

  it("returns 500 when DB insert fails", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: { sub: "user-uuid" } }, error: null });
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null, error: { message: "DB error" } });
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("DB error");
  });

  it("returns 402 when billing setup is required", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: { sub: "user-uuid" } }, error: null });
    mockRequireBillingAccess.mockResolvedValue({
      ok: false,
      response: Response.json(
        { error: "Billing setup required", code: "billing_setup_required" },
        { status: 402 },
      ),
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.code).toBe("billing_setup_required");
  });
});
