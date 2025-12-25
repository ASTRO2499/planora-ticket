BEGIN;

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('pending','issued','failed','redeemed','cancelled')) DEFAULT 'issued';

CREATE UNIQUE INDEX IF NOT EXISTS tickets_payment_id_key ON tickets(payment_id);
CREATE INDEX IF NOT EXISTS tickets_email_idx ON tickets(email);
CREATE INDEX IF NOT EXISTS tickets_used_idx ON tickets(used);
CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets(status);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read" ON tickets;
DROP POLICY IF EXISTS "Authenticated read" ON tickets;

CREATE POLICY "Users can read their tickets"
  ON tickets
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can insert their own tickets"
  ON tickets
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update their tickets"
  ON tickets
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

COMMIT;
