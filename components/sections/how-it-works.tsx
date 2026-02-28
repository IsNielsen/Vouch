const steps = [
  { step: "01", title: "Upload your PDF", body: "Add your document once — reuse it every time." },
  { step: "02", title: "Show the QR or tap NFC", body: "Pull up Vouch when you're face-to-face. One scan or tap is all it takes." },
  { step: "03", title: "They verify & sign", body: "The signer authenticates with Face ID or fingerprint on their own device. Done in seconds." },
  { step: "04", title: "Sealed and stored", body: "A tamper-evident PDF with full audit trail is ready the moment they sign." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <h2 className="text-4xl font-bold text-center">How Vouch works</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          {steps.map(({ step, title, body }) => (
            <div key={step} className="flex flex-col gap-3">
              <span className="text-5xl font-bold text-primary/20">{step}</span>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
