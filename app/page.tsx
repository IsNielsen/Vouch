import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/sections/hero";
import { UploadFeature } from "@/components/sections/upload-feature";
import { FeaturesGrid } from "@/components/sections/features-grid";
import { Pricing } from "@/components/sections/pricing";
import { WhoUses } from "@/components/sections/who-uses";
import { CtaSplit } from "@/components/sections/cta-split";
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
      <UploadFeature />
      <FeaturesGrid />
      <Pricing />
      <WhoUses />
      <CtaSplit />
      <TrustSignals />
      <HowItWorks />
      <Faq />
      <Footer />
    </div>
  );
}
