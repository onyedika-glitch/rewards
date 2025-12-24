-- Migration: Create table offer_claims and RPC function claim_offer
-- Run this in your Supabase SQL editor or as a migration

-- 1) Create table for recording claims
CREATE TABLE IF NOT EXISTS public.offer_claims (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  offer_id text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicate claims per user+offer
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'offer_claims_user_offer_unique'
  ) THEN
    ALTER TABLE public.offer_claims ADD CONSTRAINT offer_claims_user_offer_unique UNIQUE (user_id, offer_id);
  END IF;
END $$;

-- 2) Optional: create an index to quickly query by user
CREATE INDEX IF NOT EXISTS idx_offer_claims_user_id ON public.offer_claims (user_id);

-- 3) Create a claim_offer RPC function
-- This function attempts to award points for an offer in a safe, idempotent way.
-- It first checks whether the user exists and whether the offer has already been claimed.
-- It will try to derive the points from an `offers` table (if present) or a `rewards` table, falling back
-- to the provided p_points parameter (if supplied) or fail when points cannot be determined.

CREATE OR REPLACE FUNCTION public.claim_offer(user_id uuid, offer_id text, p_points integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_points integer;
  v_existing record;
BEGIN
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('status','error','message','user_id required');
  END IF;

  -- prevent duplicate claims
  SELECT 1 INTO v_existing FROM public.offer_claims WHERE user_id = user_id AND offer_id = offer_id LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('status','already_claimed');
  END IF;

  -- determine points: prefer supplied p_points, then offers.points, then rewards.cost
  IF p_points IS NOT NULL THEN
    v_points := p_points;
  ELSE
    BEGIN
      SELECT points INTO v_points FROM public.offers WHERE id = offer_id LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
      v_points := NULL;
    END;

    IF v_points IS NULL THEN
      BEGIN
        SELECT cost INTO v_points FROM public.rewards WHERE id = offer_id LIMIT 1;
      EXCEPTION WHEN undefined_table THEN
        v_points := NULL;
      END;
    END IF;
  END IF;

  IF v_points IS NULL OR v_points <= 0 THEN
    RETURN jsonb_build_object('status','error','message','could not determine points for offer');
  END IF;

  -- Award points transactionally: lock user row, insert claim, update coins
  BEGIN
    PERFORM 1 FROM public.users WHERE id = user_id FOR UPDATE;

    INSERT INTO public.offer_claims(user_id, offer_id, points) VALUES (user_id, offer_id, v_points);

    UPDATE public.users SET coins = COALESCE(coins,0) + v_points WHERE id = user_id;

    RETURN jsonb_build_object('status','ok','points', v_points);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status','error','message',SQLERRM);
  END;
END;
$$;

-- Notes:
-- - If your schema uses different table/column names, adjust the queries accordingly.
-- - Consider granting execute permission on the function to the anon role if you want client-side RPC access via Supabase:
--   GRANT EXECUTE ON FUNCTION public.claim_offer(uuid, text, integer) TO anon;

-- Example usage (from client):
-- SELECT public.claim_offer('user-uuid-here', 'offer-1');

COMMIT;