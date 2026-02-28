import Link from "next/link";

const bullets = [
  "⚡ Signed in seconds — while they're still in front of you",
  "🔒 Biometric identity proof, not just a typed name",
  "📄 Sealed PDF with full audit trail, instantly",
  "✅ ESIGN & UETA compliant out of the box",
];

export function CtaSplit() {
  return (
    <section className="py-24 px-6 bg-gradient-to-r from-[hsl(181,100%,21%)] to-[hsl(181,100%,16%)]">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="flex flex-col gap-6 text-white">
          <h2 className="text-4xl font-bold leading-tight">
            Stop losing deals to paperwork delays.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            When you&apos;re in the room with someone ready to sign, every
            second of friction costs you. Vouch gets it done before the moment
            passes.
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
