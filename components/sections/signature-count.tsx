import { createClient } from "@/lib/supabase/server";

export async function SignatureCount() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("signature_stats")
    .select("total_signatures")
    .single();

  const count = Number(data?.total_signatures ?? 0).toLocaleString();

  return (
    <section className="bg-[#0a0a0f] py-10 border-b border-[#1a1a2e] text-center">
      <p className="text-[11px] uppercase tracking-widest text-[#444466] mb-2">
        Verifications vouched for
      </p>
      <p className="text-5xl font-semibold tabular-nums text-[#f0f0fa]">{count}</p>
    </section>
  );
}
