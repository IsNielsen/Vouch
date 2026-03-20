import { ShieldCheck, Fingerprint, EyeOff, Code2 } from "lucide-react";

const signals = [
  { icon: ShieldCheck, label: "WebAuthn W3C Standard" },
  { icon: Fingerprint, label: "NIST FIPS 204 ML-DSA" },
  { icon: EyeOff, label: "Zero PII stored" },
  { icon: Code2, label: "REST API" },
];

export function TrustSignals() {
  return (
    <section className="py-16 px-6 border-b border-border">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {signals.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-3">
            <Icon className="w-8 h-8 text-primary" />
            <p className="text-sm font-medium">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
