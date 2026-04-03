import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetClaims,
  mockGetBillingRecord,
  mockBillingPortalCreate,
  mockCustomersCreate,
  mockCheckoutCreate,
  mockUpsert,
} = vi.hoisted(() => ({
  mockGetClaims: vi.fn(),
  mockGetBillingRecord: vi.fn(),
  mockBillingPortalCreate: vi.fn(),
  mockCustomersCreate: vi.fn(),
  mockCheckoutCreate: vi.fn(),
  mockUpsert: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: mockGetClaims } }),
}));

vi.mock("@/lib/billing", () => ({
  billingStatusHasAccess: vi.fn((status: string | null | undefined) => (
    status === "active" || status === "trialing" || status === "past_due" || status === "unpaid"
  )),
  getBillingRecord: mockGetBillingRecord,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn(() => ({ upsert: mockUpsert })),
  }),
}));

vi.mock("@/lib/stripe", () => ({
  getNextUtcMonthAnchor: vi.fn(() => 1_777_600_000),
  getStripe: vi.fn(() => ({
    billingPortal: { sessions: { create: mockBillingPortalCreate } },
    customers: { create: mockCustomersCreate },
    checkout: { sessions: { create: mockCheckoutCreate } },
  })),
  isStripeBillingConfigured: vi.fn(() => true),
}));

import { POST } from "@/app/api/billing/checkout/route";

describe("POST /api/billing/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.STRIPE_METERED_PRICE_ID = "price_metered_123";
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: "user-uuid", email: "user@example.com" } },
      error: null,
    });
    mockGetBillingRecord.mockResolvedValue(null);
    mockCustomersCreate.mockResolvedValue({ id: "cus_123" });
    mockCheckoutCreate.mockResolvedValue({ id: "cs_123", url: "https://checkout.stripe.com/c/pay/cs_123" });
    mockBillingPortalCreate.mockResolvedValue({ url: "https://billing.stripe.com/session/test" });
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetClaims.mockResolvedValueOnce({ data: null, error: null });

    const res = await POST();

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("creates a checkout session without quantity for metered prices", async () => {
    const res = await POST();

    expect(res.status).toBe(200);
    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: "user@example.com",
      metadata: { user_id: "user-uuid" },
    });
    expect(mockCheckoutCreate).toHaveBeenCalledWith({
      mode: "subscription",
      customer: "cus_123",
      line_items: [{ price: "price_metered_123" }],
      success_url: "http://localhost:3000/protected/dashboard?billing=success",
      cancel_url: "http://localhost:3000/protected/dashboard?billing=cancelled",
      payment_method_collection: "always",
      subscription_data: {
        billing_cycle_anchor: 1_777_600_000,
        metadata: { user_id: "user-uuid" },
      },
      metadata: { user_id: "user-uuid" },
    });
    await expect(res.json()).resolves.toEqual({
      url: "https://checkout.stripe.com/c/pay/cs_123",
      kind: "checkout",
    });
  });

  it("returns the billing portal when the user already has access", async () => {
    mockGetBillingRecord.mockResolvedValueOnce({
      user_id: "user-uuid",
      stripe_customer_id: "cus_existing",
      billing_status: "active",
    });

    const res = await POST();

    expect(res.status).toBe(200);
    expect(mockBillingPortalCreate).toHaveBeenCalledWith({
      customer: "cus_existing",
      return_url: "http://localhost:3000/protected/dashboard",
    });
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it("returns the Stripe error message when checkout creation fails", async () => {
    mockCheckoutCreate.mockRejectedValueOnce(new Error("Metered prices must omit quantity"));

    const res = await POST();

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Metered prices must omit quantity" });
  });
});
