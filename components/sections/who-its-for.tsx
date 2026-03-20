const industries = [
  { emoji: "🏦", title: "Neobanks", body: "Add biometric step-up auth to high-value transfers without adding friction to everyday banking." },
  { emoji: "💳", title: "Payment processors", body: "Replace SMS OTP with phishing-resistant verification for transaction approval." },
  { emoji: "₿", title: "Crypto exchanges", body: "Protect withdrawals and address changes with cryptographically-bound proof of presence." },
  { emoji: "📋", title: "Lending & insurance", body: "Collect biometrically-verified consent for loan agreements and policy changes." },
  { emoji: "🛒", title: "Buy now, pay later", body: "Verify user presence at checkout to reduce first-party fraud and chargebacks." },
];

export function WhoItsFor() {
  return (
    <section className="py-24 px-6 bg-muted/20">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <h2 className="text-4xl font-bold text-center">Who it&apos;s for</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {industries.map(({ emoji, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-6 rounded-xl border border-border bg-background text-center"
            >
              <span className="text-4xl">{emoji}</span>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
