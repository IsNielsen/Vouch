import { Navbar } from "@/components/navbar";
import { WaitlistForm } from "@/components/waitlist-form";
import {
  Send,
  Fingerprint,
  FileCheck,
  ShieldCheck,
  Upload,
  Smartphone,
  Wifi,
  Clock,
  Scale,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* 1. Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32 gap-8 bg-gradient-to-b from-[hsl(181,100%,21%)] to-[hsl(181,100%,16%)]">
        <div className="max-w-3xl flex flex-col gap-5">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight text-white">
            One scan. One tap. Signed.
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Vouch is the fastest way to collect in-person electronic signatures
            — no printing, no email links, no waiting. Show the document, they
            tap to sign with their biometrics, and you&apos;re done.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/early-access"
            className="px-8 py-3 rounded-full bg-white text-[hsl(181,100%,21%)] font-semibold text-lg hover:bg-white/90 transition-colors"
          >
            Get Early Access
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-3 rounded-full border border-white text-white font-semibold text-lg hover:bg-white/10 transition-colors"
          >
            How It Works
          </a>
        </div>
      </section>

      {/* 3. Upload Feature split */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-5">
            <h2 className="text-4xl font-bold leading-tight">
              Close deals the moment you&apos;re in the room.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Upload your document once. When you&apos;re face-to-face with a
              client, show them the QR code or tap NFC — they verify with their
              device biometrics and it&apos;s signed. No printing, no chasing
              emails, no waiting.
            </p>
            <Link
              href="/early-access"
              className="w-fit px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-accent transition-colors"
            >
              Try It Free
            </Link>
          </div>
          <div className="border-2 border-dashed border-primary/30 rounded-2xl bg-muted/20 flex flex-col items-center justify-center gap-4 py-16 px-8">
            <Upload className="w-12 h-12 text-primary/50" />
            <p className="text-muted-foreground text-sm">
              Drag &amp; drop your PDF here
            </p>
            <button className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-accent transition-colors">
              Upload Document
            </button>
          </div>
        </div>
      </section>

      {/* 4. Features grid 2×2 */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          <h2 className="text-4xl font-bold text-center">
            Built for in-person signing moments
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Send,
                title: "Instant in-person handoff",
                body: "Pull up a QR code or tap NFC on your device — the signer is prompted immediately, no app or account needed.",
              },
              {
                icon: Fingerprint,
                title: "Biometric identity on their device",
                body: "They verify with Face ID or fingerprint right on their own phone — undeniable proof of who signed.",
              },
              {
                icon: FileCheck,
                title: "Signed before they leave the room",
                body: "The whole flow takes seconds. Walk away with a completed, legally binding document every time.",
              },
              {
                icon: ShieldCheck,
                title: "Tamper-evident & cryptographically sealed",
                body: "Every signature is ESIGN/UETA compliant, timestamped, and locked with a cryptographic hash. Documents are encrypted at rest and in transit — and biometric data never leaves the signer's device.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex flex-col gap-3 p-6 rounded-xl border border-border bg-background"
              >
                <Icon className="w-8 h-8 text-primary" />
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          <h2 className="text-4xl font-bold text-center">Simple pricing</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
            {/* Free */}
            <div className="flex flex-col gap-6 p-8 rounded-2xl border-2 border-primary bg-primary/5">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-widest">
                  Free
                </p>
                <p className="text-4xl font-bold mt-2">$0</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Then $1 per signature after 20
                </p>
              </div>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                <li>✓ Unlimited document uploads</li>
                <li>✓ 20 free signatures/month</li>
                <li>✓ Biometric signing</li>
                <li>✓ Audit trail</li>
              </ul>
              <WaitlistForm />
            </div>
            {/* Pro */}
            <div className="flex flex-col gap-6 p-8 rounded-2xl border border-border">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  Pro
                </p>
                <p className="text-4xl font-bold mt-2">Coming soon</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Per-seat monthly billing
                </p>
              </div>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                <li>✓ Everything in Free</li>
                <li>✓ Team management</li>
                <li>✓ Priority support</li>
              </ul>
              <Link
                href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
                className="px-6 py-2 rounded-full border border-primary text-primary font-medium text-sm text-center hover:bg-primary/5 transition-colors"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Who uses Vouch */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          <h2 className="text-4xl font-bold text-center">Who uses Vouch?</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { emoji: "🏠", title: "Real estate", body: "Sign offers and disclosures on-site, the moment a client says yes." },
              { emoji: "🏥", title: "Healthcare", body: "Collect patient consent forms at check-in — no clipboards, no scanning." },
              { emoji: "🚗", title: "Auto & retail", body: "Close paperwork at the desk while the buyer is still excited." },
              { emoji: "⚖️", title: "Legal & finance", body: "Defensible in-person signatures with a cryptographic audit trail." },
              { emoji: "🚀", title: "Startups & small businesses", body: "Move fast without the overhead — close contracts, NDAs, and agreements on the spot." },
            ].map(({ emoji, title, body }) => (
              <div
                key={title}
                className="flex flex-col gap-3 p-6 rounded-xl border border-border bg-background text-center"
              >
                <span className="text-4xl">{emoji}</span>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. "Get it done fast" split CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-[hsl(181,100%,21%)] to-[hsl(181,100%,16%)]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6 text-white">
            <h2 className="text-4xl font-bold leading-tight">
              Stop losing deals to paperwork delays.
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              When you&apos;re in the room with someone ready to sign, every
              second of friction costs you. Vouch gets it done before the moment
              passes.
            </p>
            <Link
              href="/early-access"
              className="w-fit px-8 py-3 rounded-full bg-white text-[hsl(181,100%,21%)] font-semibold text-lg hover:bg-white/90 transition-colors"
            >
        	Get Early Access 
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {[
              "⚡ Signed in seconds — while they're still in front of you",
              "🔒 Biometric identity proof, not just a typed name",
              "📄 Sealed PDF with full audit trail, instantly",
              "✅ ESIGN & UETA compliant out of the box",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-white/90 text-lg"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Trust signals */}
      <section className="py-16 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: Smartphone, label: "Works on any phone" },
            { icon: Wifi, label: "No app needed" },
            { icon: Clock, label: "Signed in seconds" },
            { icon: Scale, label: "ESIGN/UETA compliant" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <Icon className="w-8 h-8 text-primary" />
              <p className="text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. How to sign — 4 steps */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          <h2 className="text-4xl font-bold text-center">How Vouch works</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Upload your PDF", body: "Add your document once — reuse it every time." },
              { step: "02", title: "Show the QR or tap NFC", body: "Pull up Vouch when you're face-to-face. One scan or tap is all it takes." },
              { step: "03", title: "They verify & sign", body: "The signer authenticates with Face ID or fingerprint on their own device. Done in seconds." },
              { step: "04", title: "Sealed and stored", body: "A tamper-evident PDF with full audit trail is ready the moment they sign." },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col gap-3">
                <span className="text-5xl font-bold text-primary/20">{step}</span>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FAQ */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-3xl mx-auto flex flex-col gap-10">
          <h2 className="text-4xl font-bold text-center">
            Frequently asked questions
          </h2>
          <div className="flex flex-col divide-y divide-border">
            {[
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
            ].map(({ q, a }) => (
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

      {/* 11. Footer */}
      <footer className="border-t border-border py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10">
          <div className="flex flex-col gap-3">
            <span className="font-bold text-xl text-primary">Vouch</span>
            <p className="text-muted-foreground text-sm leading-relaxed">
              In-person electronic signatures that close in seconds. One scan, one tap, done.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
              Product
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/early-access" className="text-muted-foreground hover:text-foreground transition-colors">
                Early Access
              </Link>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
              Legal
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="mailto:hello@vouch.so" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © 2026 Vouch. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
