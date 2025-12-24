-- 002_create_daily_claims_and_claim_daily_points.sql

BEGIN;

-- Create table to track daily claims per user
CREATE TABLE IF NOT EXISTS daily_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  claimed_date date NOT NULL,
  points integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, claimed_date)
);

-- RPC to atomically insert a daily claim and increment user's coins only once per day
CREATE OR REPLACE FUNCTION claim_daily_points(p_user_id uuid, p_points integer)
RETURNS TABLE (claimed boolean, new_coins integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _current_coins integer;
BEGIN
  -- try to insert a claim for today; if it violates uniqueness, we'll return claimed = false
  BEGIN
    INSERT INTO daily_claims (user_id, claimed_date, points)
    VALUES (p_user_id, (now() at time zone 'utc')::date, p_points);
  EXCEPTION WHEN unique_violation THEN
    RETURN QUERY SELECT false AS claimed, u.coins AS new_coins FROM users u WHERE u.id = p_user_id;
    RETURN;
  END;

  -- if insert succeeded, increment user's coins atomically and return new value
  SELECT coins INTO _current_coins FROM users WHERE id = p_user_id FOR UPDATE;
  UPDATE users SET coins = coins + p_points WHERE id = p_user_id;
  RETURN QUERY SELECT true AS claimed, _current_coins + p_points AS new_coins;
END;
$$;

-- Allow anon/clients to execute the function if you want client-side calls
GRANT EXECUTE ON FUNCTION claim_daily_points(uuid, integer) TO anon;

COMMIT;