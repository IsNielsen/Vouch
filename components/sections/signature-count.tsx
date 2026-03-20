import { createClient } from "@/lib/supabase/server";

export async function SignatureCount() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("signature_stats")
    .select("total_signatures")
    .single();

  const count = Number(data?.total_signatures ?? 0).toLocaleString();

  return (
    <section className="py-10 px-6 border-b border-border text-center">
      <p className="text-muted-foreground text-sm uppercase tracking-widest mb-1">
        Verifications vouched for
      </p>
      <p className="text-5xl font-bold tabular-nums">{count}</p>
    </section>
  );
}
