-- 002_create_daily_claims_and_claim_daily_points.sql
-- Adds a daily_claims table to record single daily claims per user and the
-- claim_daily_points RPC which atomically inserts a daily_claim and increments
-- the user's coins if not already claimed for the day.

-- Create the daily_claims table
CREATE TABLE IF NOT EXISTS public.daily_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  claimed_date date NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, claimed_date)
);

-- Index to speed lookups
CREATE INDEX IF NOT EXISTS idx_daily_claims_user_date ON public.daily_claims (user_id, claimed_date);

-- RPC: claim_daily_points(user_id uuid, p_points integer)
-- Returns (claimed boolean, new_coins integer)

CREATE OR REPLACE FUNCTION public.claim_daily_points(p_user_id uuid, p_points integer)
RETURNS TABLE (claimed boolean, new_coins integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_coins integer;
BEGIN
  -- Initialize
  claimed := false;
  new_coins := (SELECT coins FROM public.users WHERE id = p_user_id);
  IF new_coins IS NULL THEN
    new_coins := 0;
  END IF;

  -- Attempt to insert a daily_claim for today. If unique_violation occurs, it's already claimed.
  BEGIN
    INSERT INTO public.daily_claims (user_id, claimed_date, points) VALUES (p_user_id, current_date, p_points);

    UPDATE public.users
    SET coins = COALESCE(coins, 0) + p_points
    WHERE id = p_user_id;

    SELECT coins INTO v_new_coins FROM public.users WHERE id = p_user_id;

    claimed := true;
    new_coins := v_new_coins;
    RETURN NEXT;
  EXCEPTION WHEN unique_violation THEN
    -- Already claimed today; return claimed = false and current coins
    SELECT coins INTO v_new_coins FROM public.users WHERE id = p_user_id;
    new_coins := v_new_coins;
    claimed := false;
    RETURN NEXT;
  END;
END;
$$;

-- Grant execute to anonymous role (if you want the function callable from client-side anon key)
GRANT EXECUTE ON FUNCTION public.claim_daily_points(uuid, integer) TO anon;