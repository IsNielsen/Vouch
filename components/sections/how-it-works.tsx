const steps = [
  {
    step: "01",
    title: "Your backend calls /challenge",
    body: "Send the transaction context (amount, payee, action). Vouch returns WebAuthn options and a challenge_id.",
  },
  {
    step: "02",
    title: "Your frontend prompts biometrics",
    body: "Pass the WebAuthn options to the browser. The user authenticates with Face ID or fingerprint — no app, no account.",
  },
  {
    step: "03",
    title: "Your backend calls /verify",
    body: "Send the credential assertion and challenge_id. Vouch verifies the WebAuthn response and signs the transaction context with ML-DSA.",
  },
  {
    step: "04",
    title: "You receive a signed receipt",
    body: "A post-quantum cryptographic receipt tied to the user's biometric and the exact transaction — immutable evidence for disputes and audits.",
  },
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
