import { ShieldX } from "lucide-react";
import Link from "next/link";

const problems = [
  { label: "Phishable OTPs", detail: "SMS and TOTP codes are routinely intercepted and replayed by attackers." },
  { label: "Breached passwords", detail: "Credential stuffing turns leaked databases into account takeover campaigns." },
  { label: "Synthetic identities", detail: "Fabricated profiles pass KYC checks and rack up losses before detection." },
];

export function Problem() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col gap-5">
          <h2 className="text-4xl font-bold leading-tight">
            Legacy auth can&apos;t stop modern fraud.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Chargebacks, account takeovers, and authorized push payment fraud are accelerating. Every year the gap widens between what attackers can do and what passwords and OTPs can prevent.
          </p>
          <Link
            href="/early-access"
            className="w-fit px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-accent transition-colors"
          >
            See How Vouch Helps
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          {problems.map(({ label, detail }) => (
            <div key={label} className="flex gap-4 p-5 rounded-xl border border-border bg-muted/20">
              <ShieldX className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-muted-foreground text-sm mt-1">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
