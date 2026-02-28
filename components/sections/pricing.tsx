import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";

export function Pricing() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <h2 className="text-4xl font-bold text-center">Simple pricing</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
          {/* Free */}
          <div className="flex flex-col gap-6 p-8 rounded-2xl border-2 border-primary bg-primary/5">
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-widest">
                Free
              </p>
              <p className="text-4xl font-bold mt-2">$0</p>
              <p className="text-muted-foreground text-sm mt-1">
                Then $1 per signature after 20
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>✓ Unlimited document uploads</li>
              <li>✓ 20 free signatures/month</li>
              <li>✓ Biometric signing</li>
              <li>✓ Audit trail</li>
            </ul>
            <WaitlistForm />
          </div>
          {/* Pro */}
          <div className="flex flex-col gap-6 p-8 rounded-2xl border border-border">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Pro
              </p>
              <p className="text-4xl font-bold mt-2">Coming soon</p>
              <p className="text-muted-foreground text-sm mt-1">
                Per-seat monthly billing
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>✓ Everything in Free</li>
              <li>✓ Team management</li>
              <li>✓ Priority support</li>
            </ul>
            <Link
              href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
              className="px-6 py-2 rounded-full border border-primary text-primary font-medium text-sm text-center hover:bg-primary/5 transition-colors"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
