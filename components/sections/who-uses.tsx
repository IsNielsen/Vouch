const industries = [
  { emoji: "🏠", title: "Real estate", body: "Sign offers and disclosures on-site, the moment a client says yes." },
  { emoji: "🏥", title: "Healthcare", body: "Collect patient consent forms at check-in — no clipboards, no scanning." },
  { emoji: "🚗", title: "Auto & retail", body: "Close paperwork at the desk while the buyer is still excited." },
  { emoji: "⚖️", title: "Legal & finance", body: "Defensible in-person signatures with a cryptographic audit trail." },
  { emoji: "🚀", title: "Startups & small businesses", body: "Move fast without the overhead — close contracts, NDAs, and agreements on the spot." },
];

export function WhoUses() {
  return (
    <section className="py-24 px-6 bg-muted/20">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <h2 className="text-4xl font-bold text-center">Who uses Vouch?</h2>
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
