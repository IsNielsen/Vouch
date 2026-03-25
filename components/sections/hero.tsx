import Link from "next/link";
import { SectionEyebrow } from "@/components/section-eyebrow";

export function Hero() {
  return (
    <section className="bg-[#0a0a0f] py-24 md:py-32 relative overflow-hidden">
      {/* Radial glow — hero only */}
      <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_top_right,#5577ff18,transparent)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">

          {/* Left column */}
          <div className="lg:col-span-3">
            <SectionEyebrow label="Fintech fraud prevention" className="mb-5" />

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight text-[#f0f0fa] mb-5">
              Replace SMS OTP<br />
              with <span className="text-[#5577ff]">biometric proof</span>
            </h1>

            <p className="text-lg text-[#8888a8] leading-relaxed mb-8 max-w-xl">
              Vouch gives fintech apps a single API call that returns a cryptographic,
              device-bound verification receipt. Phishing-proof. Post-quantum signed.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href="/early-access"
                className="bg-[#5577ff] hover:bg-[#3344cc] text-white px-6 py-2.5 rounded-lg text-sm font-medium tracking-tight transition-all duration-150 hover:-translate-y-px"
              >
                Request API access
              </Link>
              <a
                href="#how-it-works"
                className="bg-transparent text-[#5577ff] border border-[#3344aa] hover:border-[#5577ff] hover:bg-[#5577ff10] px-6 py-2.5 rounded-lg text-sm transition-all duration-150"
              >
                See how it works
              </a>
            </div>

            {/* Trust stats */}
            <div className="flex flex-wrap gap-6 text-xs">
              <div>
                <span className="font-semibold text-[#f0f0fa]">122% ↑</span>
                <span className="text-[#555570] ml-1">fintech ATO attacks in 2024</span>
              </div>
              <div className="w-px h-4 bg-[#1a1a2e] self-center" />
              <div>
                <span className="font-semibold text-[#f0f0fa]">1,055% ↑</span>
                <span className="text-[#555570] ml-1">SIM swap fraud</span>
              </div>
              <div className="w-px h-4 bg-[#1a1a2e] self-center" />
              <div>
                <span className="text-[#555570]">SMS OTP phished in real time</span>
              </div>
            </div>
          </div>

          {/* Right column — code card */}
          <div className="lg:col-span-2">
            <div className="bg-[#080810] border border-[#1a1a2e] border-l-2 border-l-[#5577ff] rounded-[10px] p-5 font-mono text-xs leading-loose">
              <div className="text-[#444466] italic mb-2">{"// Step 1: create challenge"}</div>
              <div>
                <span className="text-[#5577ff]">POST</span>
                <span className="text-[#8888aa]"> /api/vouch/challenge</span>
              </div>
              <div className="mt-2 text-[#8888aa]">{"{"}</div>
              <div className="pl-4">
                <span className="text-[#8888aa]">{'"transaction_context"'}</span>
                <span className="text-[#444466]">: {"{"}</span>
              </div>
              <div className="pl-8">
                <span className="text-[#8888aa]">{'"amount"'}</span>
                <span className="text-[#444466]">: </span>
                <span className="text-[#44cc88]">2500</span>
                <span className="text-[#444466]">,</span>
              </div>
              <div className="pl-8">
                <span className="text-[#8888aa]">{'"recipient"'}</span>
                <span className="text-[#444466]">: </span>
                <span className="text-[#88bbff]">{'"James Chen"'}</span>
              </div>
              <div className="pl-4 text-[#444466]">{"}"}</div>
              <div className="text-[#8888aa]">{"}"}</div>

              <div className="text-[#444466] italic mt-4 mb-2">{"// Response — verified receipt"}</div>
              <div className="text-[#8888aa]">{"{"}</div>
              <div className="pl-4">
                <span className="text-[#8888aa]">{'"verified"'}</span>
                <span className="text-[#444466]">: </span>
                <span className="text-[#44cc88]">true</span>
                <span className="text-[#444466]">,</span>
              </div>
              <div className="pl-4">
                <span className="text-[#8888aa]">{'"pqc_signature"'}</span>
                <span className="text-[#444466]">: </span>
                <span className="text-[#88bbff]">{'"ML-DSA-65..."'}</span>
              </div>
              <div className="text-[#8888aa]">{"}"}</div>
            </div>

            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#0a1a10] text-[#44cc88] border border-[#1a5533]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#44cc88]" />
                Verified
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#0d1433] text-[#5577ff] border border-[#2233aa]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5577ff]" />
                Post-quantum signed
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
