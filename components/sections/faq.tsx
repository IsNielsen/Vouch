const faqs = [
  {
    q: "What exactly does Vouch verify?",
    a: "Vouch verifies that the person holding the registered device — and who can authenticate with its biometric sensor — approved a specific transaction context. You send the context (amount, payee, action), and Vouch returns a cryptographic receipt proving the user's biometric was presented for that exact context.",
  },
  {
    q: "How is this different from WebAuthn I already have?",
    a: "Standard WebAuthn proves authentication. Vouch adds a post-quantum ML-DSA signature over the transaction context — tying the biometric event to a specific payload. That receipt is your dispute-proof evidence, independently verifiable without calling Vouch.",
  },
  {
    q: "What is ML-DSA and why does it matter?",
    a: "ML-DSA (Module-Lattice-Based Digital Signature Algorithm) is a NIST-standardized post-quantum algorithm, finalized in FIPS 204. Unlike RSA or ECDSA, ML-DSA signatures remain secure against cryptanalytic attacks from quantum computers — ensuring your receipts hold up for years.",
  },
  {
    q: "Is any biometric data stored by Vouch?",
    a: "No. Biometric verification happens entirely within the hardware-backed secure enclave on the user's device. The biometric never leaves the device. Vouch only sees the cryptographic assertion produced by the enclave.",
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

export function Faq() {
  return (
    <section className="py-24 px-6 bg-muted/20">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <h2 className="text-4xl font-bold text-center">
          Frequently asked questions
        </h2>
        <div className="flex flex-col divide-y divide-border">
          {faqs.map(({ q, a }) => (
            <details key={q} className="py-5 group">
              <summary className="cursor-pointer font-semibold text-lg list-none flex items-center justify-between gap-4">
                {q}
                <span className="text-primary text-xl group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
