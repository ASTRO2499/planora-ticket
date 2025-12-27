-- Per-event form settings for labels/types of fields and extras
CREATE TABLE IF NOT EXISTS event_form_settings (
  event_id TEXT PRIMARY KEY,
  field_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_form_settings_event ON event_form_settings(event_id);
