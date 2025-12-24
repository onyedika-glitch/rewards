# Flowvahub Rewards Page Recreation

This project recreates the Rewards page from Flowvahub.com using React and Supabase.

## Features

- User authentication (sign up/sign in) via Supabase
- Display user coin balance
- List of available rewards for redemption
- Redemption history
- Proper loading and error states

## Tech Stack

- Frontend: React with TypeScript
- Backend & Database: Supabase
- Build Tool: Vite

## Setup Instructions

Step-by-step (recommended):

1. Clone the repository and install dependencies:
   ```bash
   git clone <repository-url>
   cd rewards
   npm install
   ```

2. Create a Supabase project at https://app.supabase.com and note your **Project URL** and **anon/public key**.

3. Apply database migrations and seed data (two options):
   - Option A (Supabase SQL Editor, recommended for quick dev):
     - Open **SQL Editor** in the Supabase dashboard.
     - Run the SQL in this repository in order (files in `supabase/migrations/`):
       1. `001_create_daily_claims_and_claim_daily_points.sql` (adds daily_claims + claim RPC)
       2. `002_create_daily_claims_and_claim_daily_points.sql` (if present, our repo uses numbered migrations; run the ones present in `supabase/migrations/` in order)
       3. `003_create_rewards_and_redemptions_and_seed.sql` (creates `rewards`, `redemptions`, seeds the 8 rewards, and creates `redeem_reward` RPC)
       4. (Optional) any subsequent migration files like `004_dedupe_rewards...sql` if provided
     - Verify the `rewards` table contains 8 seeded rows after running `003`.

   - Option B (Supabase CLI / local dev DB):
     - Install Supabase CLI and follow `supabase db` docs to apply migrations from `supabase/migrations/`.

4. Configure environment variables locally:
   - Create a `.env` file at the project root with:
     ```bash
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - (Optional) For local testing of server-side RPCs, ensure the user session is authenticated when calling the frontend.

5. Run the dev server:
   ```bash
   npm run dev
   ```

6. Visit the app:
   - Open http://localhost:5173 and sign in with a user in your Supabase `users` table.
   - Go to **Rewards Hub → Redeem Rewards** to verify the 8 seeded reward cards appear (no static/demo cards). If you don't see them, re-run `003_create_rewards_and_redemptions_and_seed.sql`.

7. Test the redeem flow:
   - Ensure the test user has enough `coins` in the `users` table (update manually if needed).
   - Click **Redeem** on an unlocked reward — RPC `redeem_reward` will return whether it succeeded and the new coin balance.

Notes:
- We intentionally removed static sample rewards from the UI; the Redeem page displays only DB rows (UUID ids only) to avoid duplicates.
- If you have duplicate rows in `rewards` from earlier attempts, run the dedupe migration (if provided) or use an ad-hoc SQL query to remove duplicates by normalized title.

## Deployment

Deploy to Vercel or Netlify by connecting your GitHub repository. Set the environment variables in the deployment platform.

Live demo: [Add your deployed URL here]

## Assumptions & Trade-offs

- Data source: The frontend now relies exclusively on the database (`rewards` table) for the Redeem page — **static/demo rewards were removed** to prevent duplication. Seeder migration `003_create_rewards_and_redemptions_and_seed.sql` is included to populate the canonical 8 rewards.
- RPC design: `redeem_reward` is a **SECURITY DEFINER** function that uses `auth.uid()` to ensure the caller is the authenticated user. For stricter control you may restrict execution to a server-only role and proxy requests via a server endpoint.
- Schema compatibility: Migrations include compatibility `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` and backfills (`name`, `cost`) to make the script safe to run against older/deviant schemas — trade-off: migration includes defensive operations instead of failing fast.
- UX/Style: Implemented custom CSS to match the Flowwahub look; we preferred plain CSS and lightweight components instead of a full UI framework to keep bundle size small and maintainable.
- Error handling & testing: Basic to moderate coverage in UI states and toast messages. For production, add e2e tests for redemption flow and stronger error boundaries.
- Idempotency: The daily-claim flow and the redemption RPC are implemented to be idempotent and atomic (unique constraint + FOR UPDATE and checks), but be sure to test under concurrency in staging.

If you'd like I can:
- Add a dedupe migration to remove existing duplicate rewards from your DB (recommended if counts are off),
- Or change the RPC grants to restrict RPCs to a server role and expose a small server-side wrapper API.



## Project Structure

```
src/
├── components/
│   ├── Auth.tsx
│   ├── RewardList.tsx
│   ├── RedemptionHistory.tsx
│   └── RewardsPage.tsx
├── hooks/
│   └── useRewards.ts
├── AuthContext.tsx
├── supabaseClient.ts
├── types.ts
└── App.tsx
database/
├── 001_users.sql
├── 002_rewards.sql
├── 003_redemptions.sql
└── seed.sql
```
