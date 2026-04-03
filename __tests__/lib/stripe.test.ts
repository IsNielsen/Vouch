import { afterEach, describe, expect, it } from "vitest";

import { getNextUtcMonthAnchor, getStripe, isStripeBillingConfigured } from "@/lib/stripe";

const originalSecret = process.env.STRIPE_SECRET_KEY;

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.STRIPE_SECRET_KEY;
    return;
  }

  process.env.STRIPE_SECRET_KEY = originalSecret;
});

describe("getNextUtcMonthAnchor", () => {
  it("anchors to the next UTC month from a mid-month date", () => {
    const anchor = getNextUtcMonthAnchor(new Date("2026-04-15T12:34:56.000Z"));
    expect(new Date(anchor * 1000).toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });

  it("anchors correctly at month end", () => {
    const anchor = getNextUtcMonthAnchor(new Date("2026-04-30T23:59:59.000Z"));
    expect(new Date(anchor * 1000).toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });

  it("rolls december into january", () => {
    const anchor = getNextUtcMonthAnchor(new Date("2026-12-31T05:00:00.000Z"));
    expect(new Date(anchor * 1000).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("Stripe billing configuration", () => {
  it("reports billing as unconfigured when STRIPE_SECRET_KEY is missing", () => {
    delete process.env.STRIPE_SECRET_KEY;

    expect(isStripeBillingConfigured()).toBe(false);
    expect(() => getStripe()).toThrow("Missing STRIPE_SECRET_KEY");
  });

  it("reports billing as configured when STRIPE_SECRET_KEY is present", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";

    expect(isStripeBillingConfigured()).toBe(true);
  });
});
