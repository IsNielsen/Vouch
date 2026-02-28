import { Send, Fingerprint, FileCheck, ShieldCheck } from "lucide-react";

const features = [
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
];

export function FeaturesGrid() {
  return (
    <section className="py-24 px-6 bg-muted/20">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <h2 className="text-4xl font-bold text-center">
          Built for in-person signing moments
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, body }) => (
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
  );
}
