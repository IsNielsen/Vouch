import Link from "next/link";

export function Pricing() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <h2 className="text-4xl font-bold text-center">Simple pricing</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
          {/* Starter */}
          <div className="flex flex-col gap-6 p-8 rounded-2xl border-2 border-primary bg-primary/5">
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-widest">Starter</p>
              <p className="text-4xl font-bold mt-2">$0</p>
              <p className="text-muted-foreground text-sm mt-1">500 verifications/month free</p>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>✓ Full API access</li>
              <li>✓ WebAuthn + ML-DSA receipts</li>
              <li>✓ Signed receipt per verification</li>
            </ul>
            <Link
              href="/early-access"
              className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm text-center hover:bg-accent transition-colors"
            >
              Get Early Access
            </Link>
          </div>
          {/* Pro */}
          <div className="flex flex-col gap-6 p-8 rounded-2xl border border-border">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Pro</p>
              <p className="text-4xl font-bold mt-2">$0.01</p>
              <p className="text-muted-foreground text-sm mt-1">per verification</p>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>✓ Everything in Starter</li>
              <li>✓ Unlimited verifications</li>
              <li>✓ Webhook delivery</li>
              <li>✓ Dashboard + audit log</li>
            </ul>
            <Link
              href="/early-access"
              className="px-6 py-2 rounded-full border border-primary text-primary font-medium text-sm text-center hover:bg-primary/5 transition-colors"
            >
              Join Waitlist
            </Link>
          </div>
          {/* Enterprise */}
          <div className="flex flex-col gap-6 p-8 rounded-2xl border border-border">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Enterprise</p>
              <p className="text-4xl font-bold mt-2">Custom</p>
              <p className="text-muted-foreground text-sm mt-1">Volume discounts + SLA</p>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>✓ Everything in Pro</li>
              <li>✓ Dedicated support</li>
              <li>✓ Custom retention policy</li>
              <li>✓ On-prem option</li>
            </ul>
            <Link
              href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@vouch.so"}`}
              className="px-6 py-2 rounded-full border border-primary text-primary font-medium text-sm text-center hover:bg-primary/5 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
