import { Smartphone, Wifi, Clock, Scale } from "lucide-react";

const signals = [
  { icon: Smartphone, label: "Works on any phone" },
  { icon: Wifi, label: "No app needed" },
  { icon: Clock, label: "Signed in seconds" },
  { icon: Scale, label: "ESIGN/UETA compliant" },
];

export function TrustSignals() {
  return (
    <section className="py-16 px-6 border-b border-border">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {signals.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-3">
            <Icon className="w-8 h-8 text-primary" />
            <p className="text-sm font-medium">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
