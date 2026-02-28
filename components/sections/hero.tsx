import Link from "next/link";

export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-6 py-32 gap-8 bg-gradient-to-b from-[hsl(181,100%,21%)] to-[hsl(181,100%,16%)]">
      <div className="max-w-3xl flex flex-col gap-5">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight text-white">
          One scan. One tap. Signed.
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          Vouch is the fastest way to collect in-person electronic signatures —
          no printing, no email links, no waiting. Show the document, they tap
          to sign with their biometrics, and you&apos;re done.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/early-access"
          className="px-8 py-3 rounded-full bg-white text-[hsl(181,100%,21%)] font-semibold text-lg hover:bg-white/90 transition-colors"
        >
          Get Early Access
        </Link>
        <a
          href="#how-it-works"
          className="px-8 py-3 rounded-full border border-white text-white font-semibold text-lg hover:bg-white/10 transition-colors"
        >
          How It Works
        </a>
      </div>
    </section>
  );
}
