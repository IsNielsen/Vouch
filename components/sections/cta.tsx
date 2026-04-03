import Link from "next/link";
import { SectionEyebrow } from "@/components/section-eyebrow";

export function Cta() {
  return (
    <section className="bg-[#0a0a0f] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-[10px] p-10 md:p-14 grid md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-5">
            <SectionEyebrow label="Get started" />
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight text-[#f0f0fa]">
              Stop losing money to fraud you could have prevented.
            </h2>
            <p className="text-[#8888a8] leading-relaxed">
              Every transaction that slips through costs you more than the fraud itself — chargebacks, dispute ops, regulatory scrutiny. Verum closes the gap in an afternoon.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/early-access"
                className="bg-[#5577ff] hover:bg-[#3344cc] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover:-translate-y-px"
              >
                Get early access
              </Link>
              <Link
                href="/demo"
                className="bg-transparent text-[#5577ff] border border-[#3344aa] hover:border-[#5577ff] hover:bg-[#5577ff10] px-6 py-2.5 rounded-lg text-sm transition-all duration-150"
              >
                Try the demo
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {[
              "Phishing-resistant — no shared secret to steal",
              "Sub-second verification — zero user friction",
              "Post-quantum signed receipt per transaction",
              "REST API — two endpoints, one afternoon",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-[#8888a8]">
                <span className="text-[#5577ff] shrink-0">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
