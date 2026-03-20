import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { WhyVouch } from "@/components/sections/why-vouch";
import { Pricing } from "@/components/sections/pricing";
import { WhoItsFor } from "@/components/sections/who-its-for";
import { Cta } from "@/components/sections/cta";
import { TrustSignals } from "@/components/sections/trust-signals";
import { SignatureCount } from "@/components/sections/signature-count";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Faq } from "@/components/sections/faq";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />
      <Suspense>
        <SignatureCount />
      </Suspense>
      <Problem />
      <WhyVouch />
      <Pricing />
      <WhoItsFor />
      <Cta />
      <TrustSignals />
      <HowItWorks />
      <Faq />
      <Footer />
    </div>
  );
}
