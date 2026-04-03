const steps = [
  {
    num: 1,
    title: "Call the challenge endpoint",
    body: "Your backend calls the challenge endpoint with user ID and transaction context. Takes one line of code.",
    code: "POST /api/vouch/challenge",
  },
  {
    num: 2,
    title: "Frontend prompts biometrics",
    body: "Pass the WebAuthn options to the browser. The user authenticates with Face ID or fingerprint — no app, no account required.",
    code: null,
  },
  {
    num: 3,
    title: "Call the verify endpoint",
    body: "Send the credential assertion and challenge ID. Verum verifies the WebAuthn response and signs the transaction context with ML-DSA.",
    code: null,
  },
  {
    num: 4,
    title: "Receive a signed receipt",
    body: "A post-quantum cryptographic receipt tied to the user's biometric and the exact transaction — immutable evidence for disputes and audits.",
    code: 'POST /api/vouch/verify/{challenge_id}',
  },
];

import { SectionEyebrow } from "@/components/section-eyebrow";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#0a0a0f] py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <SectionEyebrow label="How it works" className="mb-4" />

        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#f0f0fa] mb-3">
          Two endpoints. One afternoon.
        </h2>
        <p className="text-[#8888a8] mb-12 max-w-xl leading-relaxed">
          Drop biometric fraud prevention into any existing flow.
        </p>

        <div className="relative mt-4">
          {/* Vertical connector line */}
          <div className="absolute left-5 top-8 bottom-8 w-px bg-[#1a1a2e]" />

          <div className="space-y-10">
            {steps.map(({ num, title, body, code }) => (
              <div key={num} className="flex gap-6">
                <div className="w-10 h-10 rounded-full bg-[#5577ff] text-white text-sm font-medium flex items-center justify-center shrink-0 z-10">
                  {num}
                </div>
                <div className="pt-1.5">
                  <h3 className="text-base font-semibold text-[#f0f0fa] mb-1">{title}</h3>
                  <p className="text-sm text-[#8888a8] leading-relaxed mb-3">{body}</p>
                  {code && (
                    <div className="font-mono text-xs bg-[#080810] border border-[#1a1a2e] border-l-2 border-l-[#5577ff] rounded-lg p-3 text-[#8888a8]">
                      {code}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
