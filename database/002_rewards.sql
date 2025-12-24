-- Create rewards table
CREATE TABLE rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  description TEXT
);

-- Enable RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read rewards
CREATE POLICY "Anyone can view rewards" ON rewards
  FOR SELECT USING (true);