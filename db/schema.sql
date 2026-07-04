-- MailStats schema
-- Run this once against your PostgreSQL database (see README for options).

CREATE TABLE IF NOT EXISTS domains (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mail_events (
  id BIGSERIAL PRIMARY KEY,
  domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  request_id TEXT,
  webhook_request_id TEXT,
  subject TEXT,
  from_address TEXT,
  to_addresses TEXT[] NOT NULL DEFAULT '{}',
  client_reference TEXT,
  email_reference TEXT,
  recipient TEXT,
  reason TEXT,
  diagnostic_message TEXT,
  processed_time TIMESTAMPTZ,
  raw_payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mail_events_domain_id ON mail_events (domain_id);
CREATE INDEX IF NOT EXISTS idx_mail_events_event_name ON mail_events (event_name);
CREATE INDEX IF NOT EXISTS idx_mail_events_received_at ON mail_events (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_events_domain_received ON mail_events (domain_id, received_at DESC);
