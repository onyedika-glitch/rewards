-- 003_create_rewards_and_redemptions_and_seed.sql

BEGIN;

-- Create rewards table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  points integer,
  coming_soon boolean NOT NULL DEFAULT false,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  points integer NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the 8 rewards if they do not already exist (by title)
INSERT INTO rewards (title, description, points, coming_soon, icon)
SELECT * FROM (VALUES
  ('$5 Bank Transfer', 'The $5 equivalent will be transferred to your bank account.', 5000, false, 'bank'),
  ('$5 PayPal International', 'Receive a $5 PayPal balance transfer directly to your PayPal email.', 5000, false, 'paypal'),
  ('$5 Virtual Visa Card', 'Use your $5 prepaid card to shop anywhere Visa is accepted online.', 5000, false, 'visa'),
  ('$5 Apple Gift Card', 'Redeem this $5 Apple Gift Card for apps, games and media on the App Store.', 5000, false, 'apple'),
  ('$5 Google Play Card', 'Use this $5 Google Play Gift Card to purchase apps, games and more.', 5000, false, 'play'),
  ('$5 Amazon Gift Card', 'Get a $5 digital gift card to spend on your favorite tools or platforms.', 5000, false, 'amazon'),
  ('$10 Amazon Gift Card', 'Get a $10 digital gift card to spend on Amazon.', 10000, false, 'amazon10'),
  ('Free Udemy Course', 'A curated Udemy course — coming soon.', NULL, true, 'udemy')
) AS v(title, description, points, coming_soon, icon)
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE rewards.title = v.title);

-- Secure RPC to atomically redeem a reward for the calling user
CREATE OR REPLACE FUNCTION redeem_reward(p_reward_id uuid)
RETURNS TABLE (redeemed boolean, new_coins integer, redemption_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _uid uuid := auth.uid();
  _cost integer;
  _coming boolean;
  _current integer;
  _red_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  SELECT points, coming_soon INTO _cost, _coming FROM rewards WHERE id = p_reward_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'reward_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF _coming THEN
    RETURN QUERY SELECT false AS redeemed, (SELECT coins FROM users WHERE id = _uid) AS new_coins, NULL::uuid;
    RETURN;
  END IF;

  IF _cost IS NULL OR _cost <= 0 THEN
    -- treat as free reward (not charged), create redemption and return
    INSERT INTO redemptions (user_id, reward_id, points, status) VALUES (_uid, p_reward_id, COALESCE(_cost,0), 'completed') RETURNING id INTO _red_id;
    RETURN QUERY SELECT true AS redeemed, (SELECT coins FROM users WHERE id = _uid) AS new_coins, _red_id;
    RETURN;
  END IF;

  -- ensure user has enough coins and update atomically
  SELECT coins INTO _current FROM users WHERE id = _uid FOR UPDATE;
  IF _current < _cost THEN
    RETURN QUERY SELECT false AS redeemed, _current AS new_coins, NULL::uuid;
    RETURN;
  END IF;

  UPDATE users SET coins = coins - _cost WHERE id = _uid;

  INSERT INTO redemptions (user_id, reward_id, points, status) VALUES (_uid, p_reward_id, _cost, 'completed') RETURNING id INTO _red_id;

  SELECT coins INTO _current FROM users WHERE id = _uid;

  RETURN QUERY SELECT true AS redeemed, _current AS new_coins, _red_id;
END;
$$;

-- Grant execute to authenticated role only
GRANT EXECUTE ON FUNCTION redeem_reward(uuid) TO authenticated;

COMMIT;