CREATE TABLE demo_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid NOT NULL UNIQUE,
  started_at      timestamptz NOT NULL DEFAULT now(),
  last_event_at   timestamptz NOT NULL DEFAULT now(),

  -- Context
  ip_address      text,
  browser         text,   -- Chrome | Safari | Firefox | Edge | other
  os              text,   -- macOS | Windows | iOS | Android | Linux | other
  device_type     text,   -- mobile | tablet | desktop
  referrer        text,

  -- Code panel engagement
  code_tabs_viewed  text[]  DEFAULT '{}',
  code_copied       bool    DEFAULT false,

  -- Registration funnel
  reg_attempted   bool    DEFAULT false,
  reg_succeeded   bool    DEFAULT false,
  reg_error       text,
  reg_duration_ms int,

  -- Form engagement (signals real intent vs. bounce)
  amount_changed    bool DEFAULT false,
  recipient_changed bool DEFAULT false,
  account_changed   bool DEFAULT false,
  note_changed      bool DEFAULT false,

  -- Verification funnel
  verify_attempted   bool DEFAULT false,
  verify_succeeded   bool DEFAULT false,
  verify_error       text,
  verify_duration_ms int,

  -- Outcome
  funnel_stage        text DEFAULT 'landed',  -- landed | registered | verified
  session_duration_ms int,

  -- Raw event log for debugging
  events jsonb DEFAULT '[]'::jsonb
);

CREATE INDEX ON demo_sessions (started_at);
CREATE INDEX ON demo_sessions (funnel_stage);
CREATE INDEX ON demo_sessions (device_type);

-- Append a tab to code_tabs_viewed only if not already present
CREATE OR REPLACE FUNCTION demo_session_add_tab(
  p_session_id uuid,
  p_tab        text,
  p_now        timestamptz,
  p_event      jsonb
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO demo_sessions (session_id, started_at, last_event_at, code_tabs_viewed, events)
  VALUES (p_session_id, p_now, p_now, ARRAY[p_tab], jsonb_build_array(p_event))
  ON CONFLICT (session_id) DO UPDATE SET
    last_event_at    = p_now,
    code_tabs_viewed = CASE
      WHEN p_tab = ANY(demo_sessions.code_tabs_viewed) THEN demo_sessions.code_tabs_viewed
      ELSE demo_sessions.code_tabs_viewed || p_tab
    END,
    events = demo_sessions.events || jsonb_build_array(p_event);
END;
$$;

-- Append an event to the events JSONB array
CREATE OR REPLACE FUNCTION demo_session_append_event(
  p_session_id uuid,
  p_event      jsonb
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE demo_sessions
  SET events = events || jsonb_build_array(p_event)
  WHERE session_id = p_session_id;
END;
$$;
