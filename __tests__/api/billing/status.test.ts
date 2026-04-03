import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetClaims,
  mockGetBillingRecord,
  mockSyncBillingRecordFromStripe,
  mockSyncBillingRecordFromStripeForUser,
} = vi.hoisted(() => ({
  mockGetClaims: vi.fn(),
  mockGetBillingRecord: vi.fn(),
  mockSyncBillingRecordFromStripe: vi.fn(),
  mockSyncBillingRecordFromStripeForUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: mockGetClaims } }),
}));

vi.mock("@/lib/billing", () => ({
  billingStatusHasAccess: vi.fn((status: string | null | undefined) => (
    status === "active" || status === "trialing" || status === "past_due" || status === "unpaid"
  )),
  getBillingRecord: mockGetBillingRecord,
  syncBillingRecordFromStripe: mockSyncBillingRecordFromStripe,
  syncBillingRecordFromStripeForUser: mockSyncBillingRecordFromStripeForUser,
}));

import { GET } from "@/app/api/billing/status/route";

describe("GET /api/billing/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: "user-uuid", email: "user@example.com" } },
      error: null,
    });
    mockGetBillingRecord.mockResolvedValue(null);
    mockSyncBillingRecordFromStripe.mockImplementation(async (_userId: string, record: unknown) => record);
    mockSyncBillingRecordFromStripeForUser.mockResolvedValue(null);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetClaims.mockResolvedValueOnce({ data: null, error: null });

    const res = await GET();

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("syncs a stale billing record before responding", async () => {
    mockGetBillingRecord.mockResolvedValueOnce({
      user_id: "user-uuid",
      stripe_customer_id: "cus_123",
      stripe_subscription_id: null,
      stripe_checkout_session_id: "cs_123",
      billing_status: "checkout_started",
      billing_setup_completed_at: null,
      current_period_start: null,
      current_period_end: null,
      last_checkout_at: "2026-04-02T12:00:00.000Z",
    });
    mockSyncBillingRecordFromStripe.mockResolvedValueOnce({
      user_id: "user-uuid",
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_123",
      stripe_checkout_session_id: "cs_123",
      billing_status: "active",
      billing_setup_completed_at: "2026-04-02T12:01:00.000Z",
      current_period_start: "2026-04-01T00:00:00.000Z",
      current_period_end: "2026-05-01T00:00:00.000Z",
      last_checkout_at: "2026-04-02T12:00:00.000Z",
    });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(mockSyncBillingRecordFromStripe).toHaveBeenCalledWith("user-uuid", expect.objectContaining({
      billing_status: "checkout_started",
      stripe_checkout_session_id: "cs_123",
    }));
    await expect(res.json()).resolves.toEqual({
      requires_billing_setup: false,
      billing_status: "active",
      has_active_subscription: true,
      customer_portal_available: true,
      current_period_start: "2026-04-01T00:00:00.000Z",
      current_period_end: "2026-05-01T00:00:00.000Z",
    });
  });

  it("recovers billing when the local row is missing", async () => {
    mockSyncBillingRecordFromStripeForUser.mockResolvedValueOnce({
      user_id: "user-uuid",
      stripe_customer_id: "cus_456",
      stripe_subscription_id: "sub_456",
      stripe_checkout_session_id: null,
      billing_status: "active",
      billing_setup_completed_at: "2026-04-02T12:01:00.000Z",
      current_period_start: "2026-04-01T00:00:00.000Z",
      current_period_end: "2026-05-01T00:00:00.000Z",
      last_checkout_at: null,
    });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(mockSyncBillingRecordFromStripeForUser).toHaveBeenCalledWith({
      userId: "user-uuid",
      email: "user@example.com",
    });
    await expect(res.json()).resolves.toEqual({
      requires_billing_setup: false,
      billing_status: "active",
      has_active_subscription: true,
      customer_portal_available: true,
      current_period_start: "2026-04-01T00:00:00.000Z",
      current_period_end: "2026-05-01T00:00:00.000Z",
    });
  });
});
