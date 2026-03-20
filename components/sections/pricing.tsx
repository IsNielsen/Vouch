import Link from "next/link";
import { SectionEyebrow } from "@/components/section-eyebrow";

export function Pricing() {
  return (
    <section className="bg-[#0a0a0f] py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <SectionEyebrow label="Pricing" className="mb-4" />

        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#f0f0fa] mb-3">
          Simple, usage-based pricing
        </h2>
        <p className="text-[#8888a8] mb-12 max-w-xl leading-relaxed">
          Start free. Pay only when you scale.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pilot */}
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-[10px] p-8 hover:border-[#2a2a3a] transition-colors duration-200">
            <h3 className="text-sm font-semibold text-[#f0f0fa] mb-1">Pilot</h3>
            <div className="text-4xl font-semibold tracking-tight text-[#f0f0fa] mt-3 mb-1">Free</div>
            <div className="text-sm text-[#555570] mb-6">up to 1,000 verifications/month</div>
            <ul className="space-y-3 text-sm text-[#8888a8] mb-8">
              <li className="flex items-center gap-2"><span className="text-[#44cc88]">✓</span> Full API access</li>
              <li className="flex items-center gap-2"><span className="text-[#44cc88]">✓</span> WebAuthn + ML-DSA receipts</li>
              <li className="flex items-center gap-2"><span className="text-[#44cc88]">✓</span> Signed receipt per verification</li>
              <li className="flex items-center gap-2"><span className="text-[#44cc88]">✓</span> Developer docs + support</li>
            </ul>
            <Link
              href="/early-access"
              className="block w-full text-center bg-transparent text-[#5577ff] border border-[#3344aa] hover:border-[#5577ff] hover:bg-[#5577ff10] py-2.5 rounded-lg text-sm transition-all duration-150"
            >
              Request access
            </Link>
          </div>

          {/* Growth — featured */}
          <div className="bg-[#111118] border border-[#5577ff] rounded-[10px] p-8 relative">
            <div className="absolute -top-3 left-6">
              <span className="bg-[#0d1433] text-[#5577ff] border border-[#2233aa] text-[11px] px-3 py-1 rounded-full">
                Design partner
              </span>
            </div>
            <h3 className="text-sm font-semibold text-[#f0f0fa] mb-1">Growth</h3>
            <div className="text-4xl font-semibold tracking-tight text-[#f0f0fa] mt-3 mb-1">
              $0.08
              <span className="text-lg text-[#555570] font-normal">/verification</span>
            </div>
            <div className="text-sm text-[#555570] mb-6">above 1,000/month</div>
            <ul className="space-y-3 text-sm text-[#8888a8] mb-8">
              <li className="flex items-center gap-2"><span className="text-[#44cc88]">✓</span> Everything in Pilot</li>
              <li className="flex items-center gap-2"><span className="text-[#44cc88]">✓</span> Unlimited verifications</li>
              <li className="flex items-center gap-2"><span className="text-[#44cc88]">✓</span> Webhook delivery</li>
              <li className="flex items-center gap-2"><span className="text-[#44cc88]">✓</span> Dedicated integration support</li>
            </ul>
            <Link
              href="/early-access"
              className="block w-full text-center bg-[#5577ff] hover:bg-[#3344cc] text-white py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover:-translate-y-px"
            >
              Request access
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[#444466] mt-5">
          Significantly cheaper than SMS OTP at scale. No per-seat pricing.
        </p>
      </div>
    </section>
  );
}
