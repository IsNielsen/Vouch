import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-16 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10">
        <div className="flex flex-col gap-3">
          <span className="font-bold text-xl text-primary">Vouch</span>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Biometric fraud prevention API. Post-quantum signed receipts for every verification.
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
  );
}
