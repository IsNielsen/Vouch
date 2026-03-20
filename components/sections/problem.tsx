const stats = [
  {
    number: "1,055%",
    label: "SIM swap fraud increase in 2024",
    body: "Attackers port your number, receive your OTP, drain the account. Your SMS code is the attack surface.",
  },
  {
    number: "122%",
    label: "Rise in fintech account takeovers",
    body: "Credential stuffing turns leaked databases into account takeover campaigns at industrial scale.",
  },
  {
    number: "Real time",
    label: "SMS OTP phished live",
    body: "Adversary-in-the-middle proxies capture and replay OTPs before the user even notices.",
  },
];

import { SectionEyebrow } from "@/components/section-eyebrow";

export function Problem() {
  return (
    <section className="bg-[#0a0a0f] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionEyebrow label="The problem" className="mb-4" />

        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#f0f0fa] mb-3">
          SMS OTP is broken. Fraud knows it.
        </h2>
        <p className="text-[#8888a8] mb-12 max-w-xl leading-relaxed">
          The attacks have outpaced the authentication method.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stats.map(({ number, label, body }) => (
            <div
              key={label}
              className="bg-[#111118] border border-[#1a1a2e] border-t-2 border-t-[#5577ff] rounded-[10px] p-6 hover:border-[#2a2a3a] transition-colors duration-200"
            >
              <div className="text-4xl font-semibold text-[#5577ff] tracking-tight mb-2">{number}</div>
              <div className="text-sm font-medium text-[#f0f0fa] mb-2">{label}</div>
              <p className="text-sm text-[#8888a8] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
