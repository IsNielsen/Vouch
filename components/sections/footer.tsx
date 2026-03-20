import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-[#1a1a2e] py-16 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
        <div className="flex flex-col gap-3">
          <span className="font-semibold text-xl text-[#f0f0fa]">Vouch</span>
          <p className="text-[#8888a8] text-sm leading-relaxed">
            Biometric fraud prevention API. Post-quantum signed receipts for every verification.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-xs uppercase tracking-widest text-[#444466]">Product</p>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/early-access" className="text-[#8888a8] hover:text-[#f0f0fa] transition-colors duration-150">
              Early access
            </Link>
            <Link href="/demo" className="text-[#8888a8] hover:text-[#f0f0fa] transition-colors duration-150">
              Demo
            </Link>
            <a href="#how-it-works" className="text-[#8888a8] hover:text-[#f0f0fa] transition-colors duration-150">
              How it works
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-xs uppercase tracking-widest text-[#444466]">Legal</p>
          <div className="flex flex-col gap-2 text-sm">
            <a href="#" className="text-[#8888a8] hover:text-[#f0f0fa] transition-colors duration-150">
              Privacy policy
            </a>
            <a href="#" className="text-[#8888a8] hover:text-[#f0f0fa] transition-colors duration-150">
              Terms of service
            </a>
            <a href="mailto:hello@vouch.so" className="text-[#8888a8] hover:text-[#f0f0fa] transition-colors duration-150">
              Contact
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[#1a1a2e] text-center text-xs text-[#444466]">
        © 2026 Vouch. All rights reserved.
      </div>
    </footer>
  );
}
