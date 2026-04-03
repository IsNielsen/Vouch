const faqs = [
  {
    q: "What exactly does Verum verify?",
    a: "Verum verifies that the person holding the registered device — and who can authenticate with its biometric sensor — approved a specific transaction context. You send the context (amount, payee, action), and Verum returns a cryptographic receipt proving the user's biometric was presented for that exact context.",
  },
  {
    q: "How is this different from WebAuthn I already have?",
    a: "Standard WebAuthn proves authentication. Verum adds a post-quantum ML-DSA signature over the transaction context — tying the biometric event to a specific payload. That receipt is your dispute-proof evidence, independently verifiable without calling Verum.",
  },
  {
    q: "What is ML-DSA and why does it matter?",
    a: "ML-DSA (Module-Lattice-Based Digital Signature Algorithm) is a NIST-standardized post-quantum algorithm, finalized in FIPS 204. Unlike RSA or ECDSA, ML-DSA signatures remain secure against cryptanalytic attacks from quantum computers — ensuring your receipts hold up for years.",
  },
  {
    q: "Is any biometric data stored by Verum?",
    a: "No. Biometric verification happens entirely within the hardware-backed secure enclave on the user's device. The biometric never leaves the device. Verum only sees the cryptographic assertion produced by the enclave.",
  },
  {
    q: "How do I integrate?",
    a: "Two API calls: POST /api/vouch/challenge with your transaction context to start the flow, then POST /api/vouch/verify with the WebAuthn assertion and challenge ID to complete it. The verify response contains the ML-DSA signed receipt.",
  },
  {
    q: "What regulations does this support?",
    a: "The biometric + cryptographic audit trail supports Strong Customer Authentication (SCA) under PSD2/PSD3, FFIEC guidance on layered security, and provides the documented evidence trail required under CFPB dispute resolution rules.",
  },
];

import { SectionEyebrow } from "@/components/section-eyebrow";

export function Faq() {
  return (
    <section className="bg-[#111118] py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <SectionEyebrow label="FAQ" className="mb-4" />

        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#f0f0fa] mb-12">
          Frequently asked questions
        </h2>

        <div className="flex flex-col gap-2">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group bg-[#16161f] border border-[#1a1a2e] rounded-[10px] px-5 open:border-[#2a2a3a]">
              <summary className="cursor-pointer font-medium text-sm text-[#f0f0fa] hover:text-[#5577ff] list-none flex items-center justify-between gap-4 py-4 transition-colors duration-150">
                {q}
                <span className="text-[#5577ff] text-lg shrink-0 group-open:rotate-45 transition-transform duration-150">+</span>
              </summary>
              <p className="text-sm text-[#8888a8] leading-relaxed pb-4">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
