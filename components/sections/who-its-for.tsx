const industries = [
  { emoji: "🏦", title: "Neobanks", body: "Add biometric step-up auth to high-value transfers without adding friction to everyday banking." },
  { emoji: "💳", title: "Payment processors", body: "Replace SMS OTP with phishing-resistant verification for transaction approval." },
  { emoji: "₿", title: "Crypto exchanges", body: "Protect withdrawals and address changes with cryptographically-bound proof of presence." },
  { emoji: "📋", title: "Lending & insurance", body: "Collect biometrically-verified consent for loan agreements and policy changes." },
  { emoji: "🛒", title: "Buy now, pay later", body: "Verify user presence at checkout to reduce first-party fraud and chargebacks." },
];

import { SectionEyebrow } from "@/components/section-eyebrow";

export function WhoItsFor() {
  return (
    <section className="bg-[#0a0a0f] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionEyebrow label="Who it's for" className="mb-4" />

        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#f0f0fa] mb-12">
          Built for fintech teams
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {industries.map(({ emoji, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-6 rounded-[10px] border border-[#1a1a2e] bg-[#111118] text-center hover:border-[#2a2a3a] transition-colors duration-200"
            >
              <span className="text-3xl">{emoji}</span>
              <h3 className="font-semibold text-sm text-[#f0f0fa]">{title}</h3>
              <p className="text-[#8888a8] text-xs leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
