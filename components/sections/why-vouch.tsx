import { Fingerprint, ShieldCheck, EyeOff, Code2 } from "lucide-react";

const features = [
  {
    icon: Fingerprint,
    title: "WebAuthn biometric verification",
    body: "Users authenticate with Face ID or fingerprint on their own device — phishing-resistant by design, no shared secret to steal.",
  },
  {
    icon: ShieldCheck,
    title: "ML-DSA post-quantum receipts",
    body: "Every verification returns a NIST FIPS 204 ML-DSA signature over the transaction context — cryptographic proof that survives quantum computing.",
  },
  {
    icon: EyeOff,
    title: "Zero PII on Vouch servers",
    body: "No biometric data, no passwords, no credentials are stored. Nothing for an attacker to breach. Nothing for regulators to flag.",
  },
  {
    icon: Code2,
    title: "REST API — two endpoints",
    body: "POST /challenge to start, POST /verify to complete. Add biometric fraud prevention to any flow in an afternoon.",
  },
];

export function WhyVouch() {
  return (
    <section className="py-24 px-6 bg-muted/20">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <h2 className="text-4xl font-bold text-center">
          Why Vouch?
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-6 rounded-xl border border-border bg-background"
            >
              <Icon className="w-8 h-8 text-primary" />
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
