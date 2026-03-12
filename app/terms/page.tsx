import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold mt-8 mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: March 12, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Service description</h2>
            <p className="text-muted-foreground">
              Vouch provides an electronic document signing service that uses passkey (WebAuthn) biometric authentication to produce legally binding signatures under ESIGN and UETA.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. User responsibilities</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>You must only sign documents you are authorized to sign.</li>
              <li>You are responsible for ensuring the accuracy and legality of any document you upload or sign.</li>
              <li>You must not use Vouch to sign fraudulent, forged, or unauthorized documents.</li>
              <li>You are responsible for maintaining the security of the device and passkey used to authenticate.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. No warranty</h2>
            <p className="text-muted-foreground">
              Vouch is provided &quot;as is&quot; without warranty of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or suitable for any particular legal purpose. You should consult a legal professional to confirm that electronic signatures are valid in your jurisdiction and for your specific use case.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Limitation of liability</h2>
            <p className="text-muted-foreground">
              To the fullest extent permitted by law, Vouch and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the service, even if advised of the possibility of such damages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Governing law</h2>
            <p className="text-muted-foreground">
              These terms are governed by and construed in accordance with the laws of the applicable jurisdiction. [Governing jurisdiction to be specified.]
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Changes to these terms</h2>
            <p className="text-muted-foreground">
              We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the revised terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Contact</h2>
            <p className="text-muted-foreground">
              Questions?{" "}
              <a href="mailto:hello@vouch.so" className="underline hover:text-foreground">hello@vouch.so</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
