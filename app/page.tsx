import { Navbar } from "@/components/navbar";
import { WaitlistForm } from "@/components/waitlist-form";
import { Fingerprint, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

const pillars = [
  {
    icon: Fingerprint,
    title: "Identity Certainty",
    body: "Move beyond \u201cclick to sign.\u201d Bind every signature to a unique biometric profile, creating an immutable link between the signer and the document.",
  },
  {
    icon: ShieldCheck,
    title: "Legal-Grade Security",
    body: "Built with industry-standard encryption and biometric protocols to meet the highest compliance demands for digital signatures.",
  },
  {
    icon: Zap,
    title: "Zero Friction",
    body: "No more forgotten passwords or complex 2FA apps. A single touch or glance is all it takes to execute a binding agreement.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32 gap-8 bg-gradient-to-b from-background to-muted/30">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-foreground/5 border border-foreground/10">
          <Fingerprint className="w-10 h-10 text-foreground/70" />
        </div>
        <div className="max-w-3xl flex flex-col gap-4">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            The legal signature,<br />upgraded with biometrics.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop relying on easily forged passwords and email links. Vouch uses biometric authentication to ensure that the person signing your document is exactly who they say they are.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="px-8 py-3 rounded-lg bg-foreground text-background font-semibold text-lg hover:bg-foreground/90 transition-colors"
        >
          Get Early Access
        </Link>
      </section>

      {/* Three Pillars */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-6 rounded-xl border border-foreground/10 bg-muted/20"
            >
              <Icon className="w-8 h-8 text-foreground/60" />
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founder's Note */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-2xl mx-auto text-center flex flex-col gap-4">
          <p className="text-lg text-muted-foreground italic leading-relaxed">
            &ldquo;Standard digital signatures haven&rsquo;t evolved in a decade. We built Vouch to bring physical-world certainty to the digital legal space, ensuring that &lsquo;identity&rsquo; is never a question mark.&rdquo;
          </p>
          <p className="text-sm font-medium">— The Vouch Team</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-xl mx-auto text-center flex flex-col gap-4">
          <h2 className="text-3xl font-bold">Ready to secure your next agreement?</h2>
          <p className="text-muted-foreground">Join the waitlist for the Vouch Beta.</p>
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-foreground/10 py-8 px-6">
        <div className="max-w-5xl mx-auto flex justify-center gap-8 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
