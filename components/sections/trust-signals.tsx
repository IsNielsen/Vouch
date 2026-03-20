import { ShieldCheck, Fingerprint, EyeOff, Code2 } from "lucide-react";

const signals = [
  { icon: ShieldCheck, label: "WebAuthn W3C standard" },
  { icon: Fingerprint, label: "NIST FIPS 204 ML-DSA" },
  { icon: EyeOff, label: "Zero PII stored" },
  { icon: Code2, label: "REST API" },
];

export function TrustSignals() {
  return (
    <section className="bg-[#0a0a0f] py-12 border-b border-[#1a1a2e]">
      <div className="max-w-4xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {signals.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-3">
            <Icon className="w-7 h-7 text-[#5577ff]" />
            <p className="text-xs font-medium text-[#8888a8]">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
