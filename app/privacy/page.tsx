import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Vouch",
  description: "How Vouch collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-[#0a0a0f] min-h-screen py-20 md:py-28 antialiased">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-4 h-px bg-[#5577ff]" />
          <span className="text-[11px] uppercase tracking-widest text-[#444466]">
            Legal
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#f0f0fa] mb-3">
          Privacy policy
        </h1>
        <p className="text-sm text-[#555570] mb-12">
          Last updated: March 25, 2026
        </p>

        <div className="space-y-10 text-sm text-[#8888a8] leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              1. Overview
            </h2>
            <p>
              Vouch (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
              provides a fraud-prevention API that uses WebAuthn biometric
              authentication to issue cryptographic verification receipts. This
              policy explains what data we collect, why we collect it, and how
              we protect it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              2. Data we collect
            </h2>
            <div className="space-y-4">
              <div className="bg-[#111118] border border-[#1a1a2e] rounded-[10px] p-5">
                <h3 className="text-sm font-semibold text-[#f0f0fa] mb-2">
                  Account &amp; authentication data
                </h3>
                <p>
                  Email address, WebAuthn public key credential identifiers, and
                  authenticator metadata (device type, counter). We never store
                  biometric data — that stays on your device.
                </p>
              </div>
              <div className="bg-[#111118] border border-[#1a1a2e] rounded-[10px] p-5">
                <h3 className="text-sm font-semibold text-[#f0f0fa] mb-2">
                  Verification receipts
                </h3>
                <p>
                  When a challenge is verified, we store the challenge ID,
                  transaction context provided by your integration, the
                  ML-DSA-signed receipt, IP address of the verifying device, and
                  a timestamp. We do not store raw assertion data beyond what is
                  needed to produce the receipt.
                </p>
              </div>
              <div className="bg-[#111118] border border-[#1a1a2e] rounded-[10px] p-5">
                <h3 className="text-sm font-semibold text-[#f0f0fa] mb-2">
                  Usage &amp; analytics
                </h3>
                <p>
                  API request counts, error rates, and latency metrics for
                  billing and reliability purposes. We use Vercel Analytics for
                  anonymous page-view data on our marketing site.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              3. How we use your data
            </h2>
            <ul className="space-y-2 list-none">
              {[
                "Authenticate you and manage your account",
                "Generate and deliver verification receipts to your application",
                "Calculate usage for billing purposes",
                "Detect abuse or fraudulent use of the Vouch API",
                "Send transactional emails (receipt copies, account notices)",
                "Improve reliability and performance of the service",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#5577ff] mt-0.5 shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              We do not sell your data. We do not use your data to train machine
              learning models.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              4. Data sharing
            </h2>
            <p className="mb-3">
              We share data only with:
            </p>
            <ul className="space-y-2 list-none">
              {[
                "Supabase — our database and auth infrastructure provider",
                "Vercel — our hosting and edge compute provider",
                "Stripe — for payment processing (billing customers only)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#5577ff] mt-0.5 shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Each sub-processor is under a data processing agreement. We do not
              share data with advertising networks or data brokers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              5. Data retention
            </h2>
            <p>
              Account data is retained while your account is active and for 90
              days after deletion. Verification receipts are retained for 7
              years to support audit requirements common in financial services.
              You may request earlier deletion of your account data by contacting
              us; receipt records subject to regulatory retention may not be
              deleted early.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              6. Security
            </h2>
            <p>
              All data is encrypted in transit (TLS 1.3) and at rest (AES-256).
              Verification receipts are additionally signed with ML-DSA
              (CRYSTALS-Dilithium), a post-quantum digital signature scheme, so
              that their integrity is verifiable independently of our
              infrastructure. API keys are stored as hashed values; we cannot
              recover your plaintext key.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              7. Your rights
            </h2>
            <p>
              Depending on your jurisdiction, you may have the right to access,
              correct, or delete your personal data, or to restrict or object to
              certain processing. To exercise these rights, email us at{" "}
              <a
                href="mailto:privacy@vouch.so"
                className="text-[#5577ff] hover:text-[#3344cc] transition-colors"
              >
                privacy@vouch.so
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              8. Cookies
            </h2>
            <p>
              We use strictly necessary cookies to maintain your authenticated
              session. We do not use tracking or advertising cookies. The Vercel
              Analytics script on our marketing site does not set cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              9. Changes to this policy
            </h2>
            <p>
              We may update this policy as the service evolves. Material changes
              will be communicated by email or an in-app notice at least 14 days
              before they take effect. The &ldquo;last updated&rdquo; date at
              the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              10. Contact
            </h2>
            <p>
              Questions about this policy or our data practices:{" "}
              <a
                href="mailto:privacy@vouch.so"
                className="text-[#5577ff] hover:text-[#3344cc] transition-colors"
              >
                privacy@vouch.so
              </a>
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-16 pt-8 border-t border-[#1a1a2e]">
          <Link
            href="/"
            className="text-sm text-[#555570] hover:text-[#8888a8] transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
