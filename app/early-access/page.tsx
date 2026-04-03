import { Navbar } from "@/components/navbar";
import { WaitlistForm } from "@/components/waitlist-form";
import { SectionEyebrow } from "@/components/section-eyebrow";

export default function EarlyAccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      <Navbar />
      <section className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-xl w-full flex flex-col gap-6">
          <SectionEyebrow label="Early access" />
          <h1 className="text-4xl font-semibold tracking-tight text-[#f0f0fa]">Get early access</h1>
          <p className="text-[#8888a8] leading-relaxed">
            Join the waitlist for the Verum API. Tell us what you&apos;re building — we&apos;re onboarding fintech teams first.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </div>
  );
}
