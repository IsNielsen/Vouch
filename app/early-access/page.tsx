import { Navbar } from "@/components/navbar";
import { WaitlistForm } from "@/components/waitlist-form";

export default function EarlyAccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <section className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-xl w-full text-center flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Get Early Access</h1>
          <p className="text-muted-foreground">Join the waitlist for the Vouch Beta.</p>
          <WaitlistForm />
        </div>
      </section>
    </div>
  );
}
