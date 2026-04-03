import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Verum",
  description: "Terms governing your use of the Verum fraud-prevention API.",
};

export default function TermsPage() {
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
          Terms of service
        </h1>
        <p className="text-sm text-[#555570] mb-12">
          Last updated: March 25, 2026
        </p>

        <div className="space-y-10 text-sm text-[#8888a8] leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              1. Acceptance of terms
            </h2>
            <p>
              By accessing or using the Verum API, dashboard, or any related
              services (collectively, the &ldquo;Service&rdquo;), you agree to
              be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you
              are using the Service on behalf of an organisation, you represent
              that you have authority to bind that organisation to these Terms.
              If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              2. Description of service
            </h2>
            <p>
              Verum provides a fraud-prevention API that issues cryptographically
              signed verification receipts using WebAuthn biometric
              authentication and post-quantum ML-DSA signatures. The Service
              allows integrating parties to challenge end-users and receive a
              tamper-evident receipt attesting to the user&rsquo;s identity
              and presence at the time of a transaction.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              3. Account registration
            </h2>
            <p className="mb-3">
              To use the Service you must create an account and provide accurate,
              complete information. You are responsible for:
            </p>
            <ul className="space-y-2 list-none">
              {[
                "Maintaining the confidentiality of your API keys",
                "All activity that occurs under your account",
                "Notifying us immediately of any unauthorised use at security@vouch.so",
                "Ensuring your account information remains current",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#5577ff] mt-0.5 shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              4. API usage &amp; rate limits
            </h2>
            <p className="mb-3">
              Your plan determines your monthly verification quota and
              rate-limit ceiling. Exceeding your quota may result in requests
              being rejected until the next billing cycle or until you upgrade.
              We reserve the right to adjust limits with 14 days&rsquo; notice.
              You must not attempt to circumvent rate limits through credential
              rotation or multi-account schemes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              5. Acceptable use &amp; prohibited conduct
            </h2>
            <p className="mb-3">You must not use the Service to:</p>
            <ul className="space-y-2 list-none">
              {[
                "Violate any applicable law or regulation",
                "Authenticate individuals without their informed consent",
                "Process transactions related to illegal goods or services",
                "Reverse-engineer, decompile, or extract the Service's source code",
                "Resell or sublicence API access without written authorisation",
                "Introduce malware or otherwise interfere with the Service's integrity",
                "Use the Service in contexts that present an unreasonable risk of harm to end-users",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#5577ff] mt-0.5 shrink-0">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              6. Fees &amp; billing
            </h2>
            <p>
              Paid plans are billed monthly in advance via Stripe. All fees are
              non-refundable except as required by applicable law or as
              explicitly stated in your order. If payment fails, we may suspend
              your account after a 7-day grace period. Prices may change with
              30 days&rsquo; written notice; continued use after the effective
              date constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              7. Intellectual property
            </h2>
            <p>
              Verum retains all rights, title, and interest in the Service,
              including all software, algorithms, trademarks, and documentation.
              These Terms grant you a limited, non-exclusive, non-transferable
              licence to access and use the Service solely as permitted herein.
              You retain ownership of any data you submit to the Service;
              by submitting it you grant us a licence to process it as necessary
              to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              8. Disclaimers &amp; limitation of liability
            </h2>
            <p className="mb-3">
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF
              ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
              NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
            </p>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, VOUCH&rsquo;S TOTAL
              LIABILITY TO YOU FOR ANY CLAIM ARISING UNDER THESE TERMS WILL NOT
              EXCEED THE FEES YOU PAID IN THE 12 MONTHS PRECEDING THE CLAIM.
              IN NO EVENT WILL VOUCH BE LIABLE FOR INDIRECT, INCIDENTAL,
              SPECIAL, OR CONSEQUENTIAL DAMAGES, EVEN IF ADVISED OF THE
              POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              9. Indemnification
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless Verum and its
              officers, directors, employees, and agents from any claim, damage,
              loss, or expense (including reasonable legal fees) arising from
              your use of the Service, your violation of these Terms, or your
              infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              10. Termination
            </h2>
            <p>
              Either party may terminate these Terms at any time. You may cancel
              your account through the dashboard; we may suspend or terminate
              your access for material breach of these Terms upon reasonable
              notice, or immediately for conduct that poses a security or legal
              risk. Upon termination, your right to use the Service ceases and
              we may delete your account data in accordance with our Privacy
              Policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              11. Changes to terms
            </h2>
            <p>
              We may update these Terms as the Service evolves. Material changes
              will be communicated by email or an in-app notice at least 14 days
              before they take effect. Your continued use of the Service after
              the effective date constitutes acceptance of the revised Terms.
              The &ldquo;last updated&rdquo; date at the top reflects the most
              recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#f0f0fa] mb-3">
              12. Contact
            </h2>
            <p>
              Questions about these Terms:{" "}
              <a
                href="mailto:legal@vouch.so"
                className="text-[#5577ff] hover:text-[#3344cc] transition-colors"
              >
                legal@vouch.so
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
