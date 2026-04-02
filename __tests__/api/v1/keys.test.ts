import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetClaims = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: mockGetClaims } }),
}));

const insertMock = vi.fn();
const singleMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "user_billing") {
        return { select: () => ({ eq: () => ({ single: singleMock }) }) };
      }
      return { insert: insertMock };
    },
  }),
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
    singleMock.mockResolvedValue({ data: { billing_active: true } });
    insertMock.mockResolvedValue({ error: null });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetClaims.mockResolvedValue({ data: null, error: null });
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when billing not active", async () => {
    mockGetClaims.mockResolvedValue({ data: { claims: { sub: "user-uuid" } }, error: null });
    singleMock.mockResolvedValue({ data: { billing_active: false } });
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/[Bb]illing/);
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
    insertMock.mockResolvedValueOnce({ error: { message: "DB error" } });
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("DB error");
  });
});
