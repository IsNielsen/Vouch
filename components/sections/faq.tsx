const faqs = [
  {
    q: "Is an in-person electronic signature legally binding?",
    a: "Yes. ESIGN and UETA recognize electronic signatures as fully enforceable when signer intent is clear. Vouch pairs that with biometric identity proof captured in the moment — stronger than a wet ink signature.",
  },
  {
    q: "Does the signer need to download anything?",
    a: "No. They scan a QR code or tap NFC with their phone, verify with Face ID or fingerprint, and they're done. No app, no account, no friction.",
  },
  {
    q: "How fast is the signing experience?",
    a: "Under 30 seconds from scan to sealed document. The signer sees the document, authenticates biometrically, confirms intent, and it's done — before they've had time to reconsider.",
  },
  {
    q: "What devices can signers use?",
    a: "Any modern smartphone with a biometric sensor — iPhone (Face ID / Touch ID) or Android (fingerprint / face unlock). No special hardware required on your end.",
  },
  {
    q: "What happens if a signer disputes the signature?",
    a: "Every session generates a cryptographically sealed audit trail — timestamp, biometric confirmation, device fingerprint, and location — giving you ironclad evidence in any dispute.",
  },
  {
    q: "Will my signed documents hold up in 10, 20, or 30 years — even as AI and quantum computing advance?",
    a: "Yes — and we've designed Vouch specifically with this in mind. A few reasons your documents stay valid: First, legal enforceability under ESIGN and UETA is determined by the evidence captured at the moment of signing, not by future technology. Second, Vouch uses NIST-standardized post-quantum cryptographic algorithms (ML-DSA and SLH-DSA, finalized in FIPS 204/205) that are mathematically resistant to attacks from quantum computers — unlike the RSA and ECC algorithms most services still rely on. Third, biometric verification happens entirely on the signer's device inside a hardware-backed secure enclave. Their biometric data is never sent to our servers, so there is no central database for AI or any attacker to compromise. Even if every other layer were someday challenged, the layered audit trail — document hash, timestamp, biometric confirmation, device fingerprint, and IP — provides redundant proof that courts can rely on for decades.",
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
