import { SectionEyebrow } from "@/components/section-eyebrow";

const features = [
  {
    title: "Not phishable by design",
    body: "WebAuthn assertions are cryptographically bound to your exact domain. A fake site gets a useless assertion that fails verification.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5577ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Post-quantum signed receipts",
    body: "Every verification produces an ML-DSA signature — NIST FIPS 204 standardized, quantum-resistant — giving you immutable proof that survives cryptanalytic advances.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5577ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "Zero PII on Verum servers",
    body: "Biometric verification happens in the device's secure enclave. No biometric data, no passwords, no credentials ever reach Verum. Nothing to breach.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5577ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ),
  },
];

export function WhyVouch() {
  return (
    <section className="bg-[#111118] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionEyebrow label="Why Verum" className="mb-4" />

        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#f0f0fa] mb-3">
          Built for the attacks that are happening now
        </h2>
        <p className="text-[#8888a8] mb-12 max-w-xl leading-relaxed">
          Designed around the threat model, not the convenience model.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map(({ title, body, icon }) => (
            <div
              key={title}
              className="bg-[#16161f] border border-[#1a1a2e] rounded-[10px] p-6 hover:border-[#2a2a3a] transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-[#0d1433] border border-[#2233aa] flex items-center justify-center mb-4">
                {icon}
              </div>
              <h3 className="text-sm font-semibold text-[#f0f0fa] mb-2">{title}</h3>
              <p className="text-sm text-[#8888a8] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
