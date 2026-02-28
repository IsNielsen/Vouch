"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SLIDES = [
  {
    headline: "One scan. One tap. Signed.",
    body: "Vouch is the fastest way to collect in-person electronic signatures — no printing, no email links, no waiting. Show the document, they tap to sign with their biometrics, and you're done.",
  },
  {
    headline: "Secured by post-quantum cryptography.",
    body: "Every signature is protected by ML-DSA — a NIST-standardized post-quantum algorithm — ensuring your documents remain tamper-proof against both today's and tomorrow's threats.",
  },
  {
    headline: "Your biometrics are your signature.",
    body: "Signers authenticate with their device's built-in passkey. No account needed, no biometric data ever stored or transmitted — just a cryptographic proof that only they could produce.",
  },
];

export function Hero() {
  const [index, setIndex] = useState(0);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatingOut(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % SLIDES.length);
        setAnimatingOut(false);
      }, 500);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const slide = SLIDES[index];

  return (
    <section className="flex flex-col items-center justify-center text-center px-6 py-32 gap-8 bg-gradient-to-b from-[hsl(181,100%,21%)] to-[hsl(181,100%,16%)] overflow-hidden">
      <div className="w-full h-[260px] sm:h-[220px] flex items-center justify-center">
        <div
          key={index}
          className={`w-full flex flex-col gap-5 ${
            animatingOut
              ? "animate-out slide-out-to-left fade-out duration-500"
              : "animate-in slide-in-from-right fade-in duration-500"
          }`}
        >
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight text-white">
          {slide.headline}
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">{slide.body}</p>
        </div>
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
      <div className="flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setAnimatingOut(true);
              setTimeout(() => {
                setIndex(i);
                setAnimatingOut(false);
              }, 500);
            }}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === index ? "bg-white" : "bg-white/40"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
