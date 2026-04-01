-- Rate limiting table for the public demo API.
-- Tracks request counts per IP within a sliding window to prevent abuse.
CREATE TABLE IF NOT EXISTS demo_rate_limits (
  ip text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- Atomically check and increment the rate limit counter for an IP.
-- Returns true if the request is allowed, false if the limit is exceeded.
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_ip text,
  p_window_start timestamptz,
  p_limit integer
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO demo_rate_limits (ip, count, window_start)
  VALUES (p_ip, 1, now())
  ON CONFLICT (ip) DO UPDATE
    SET count = CASE
          WHEN demo_rate_limits.window_start < p_window_start
          THEN 1
          ELSE demo_rate_limits.count + 1
        END,
        window_start = CASE
          WHEN demo_rate_limits.window_start < p_window_start
          THEN now()
          ELSE demo_rate_limits.window_start
        END
  RETURNING count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;
