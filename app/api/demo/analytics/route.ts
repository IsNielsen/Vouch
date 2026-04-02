import { createAdminClient } from "@/lib/supabase/admin";

type EventData = Record<string, unknown>;

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  let body: { session_id?: string; event?: string; data?: EventData } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({}, { status: 200 });
  }

  const { session_id, event, data = {} } = body;
  if (!session_id || !event) return Response.json({}, { status: 200 });

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const eventEntry = { event, ts: now, ...data };

  if (event === "code_tab" && data.tab) {
    await supabase.rpc("demo_session_add_tab", {
      p_session_id: session_id,
      p_tab: String(data.tab),
      p_now: now,
      p_event: eventEntry,
    });
    return Response.json({}, { status: 200 });
  }

  // Build column updates for this event
  const update: Record<string, unknown> = { last_event_at: now };

  switch (event) {
    case "page_load":
      update.ip_address = ip;
      update.browser = data.browser ?? null;
      update.os = data.os ?? null;
      update.device_type = data.device_type ?? null;
      update.referrer = data.referrer ?? null;
      break;
    case "code_copy":
      update.code_copied = true;
      break;
    case "reg_start":
      update.reg_attempted = true;
      break;
    case "reg_success":
      update.reg_succeeded = true;
      update.reg_duration_ms = data.duration_ms;
      update.funnel_stage = "registered";
      break;
    case "reg_error":
      update.reg_error = data.error ?? null;
      update.reg_duration_ms = data.duration_ms ?? null;
      break;
    case "amount_change":
      update.amount_changed = true;
      break;
    case "recipient_change":
      update.recipient_changed = true;
      break;
    case "account_change":
      update.account_changed = true;
      break;
    case "note_change":
      update.note_changed = true;
      break;
    case "verify_start":
      update.verify_attempted = true;
      break;
    case "verify_success":
      update.verify_succeeded = true;
      update.verify_duration_ms = data.duration_ms ?? null;
      update.funnel_stage = "verified";
      break;
    case "verify_error":
      update.verify_error = data.error ?? null;
      update.verify_duration_ms = data.duration_ms ?? null;
      break;
    case "page_unload":
      update.session_duration_ms = data.duration_ms ?? null;
      break;
  }

  // Upsert the session row
  await supabase
    .from("demo_sessions")
    .upsert(
      { session_id, started_at: now, ...update },
      { onConflict: "session_id" }
    );

  // Append raw event entry to the log
  await supabase.rpc("demo_session_append_event", {
    p_session_id: session_id,
    p_event: eventEntry,
  });

  return Response.json({}, { status: 200 });
}
