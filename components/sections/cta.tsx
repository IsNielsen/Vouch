import Link from "next/link";

const bullets = [
  "🔒 Phishing-resistant — no shared secret to steal",
  "⚡ Sub-second verification — zero user friction",
  "📜 Post-quantum signed receipt per transaction",
  "🔑 REST API — two endpoints, one afternoon",
];

export function Cta() {
  return (
    <section className="py-24 px-6 bg-gradient-to-r from-[hsl(181,100%,21%)] to-[hsl(181,100%,16%)]">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col gap-6 text-white">
          <h2 className="text-4xl font-bold leading-tight">
            Stop losing money to fraud you could have prevented.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Every transaction that slips through costs you more than the fraud itself — chargebacks, dispute ops, regulatory scrutiny. Vouch closes the gap in an afternoon.
          </p>
          <Link
            href="/early-access"
            className="w-fit px-8 py-3 rounded-full bg-white text-[hsl(181,100%,21%)] font-semibold text-lg hover:bg-white/90 transition-colors"
          >
            Get Early Access
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          {bullets.map((item) => (
            <div key={item} className="flex items-center gap-3 text-white/90 text-lg">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
