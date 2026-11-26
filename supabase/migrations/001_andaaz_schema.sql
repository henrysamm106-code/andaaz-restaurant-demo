-- Andaaz Restaurant — Reservation & AI Concierge Management Schema
-- Operational display timezone: Asia/Karachi
-- Run in Supabase SQL Editor or migration pipeline.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Customers (deduplicated by normalized phone + workspace)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 1),
  phone_normalized TEXT NOT NULL,
  phone_display TEXT NOT NULL,
  email TEXT,
  preferred_seating TEXT CHECK (preferred_seating IN ('rooftop', 'indoor', 'no-preference')),
  dietary_requirements TEXT,
  previous_occasions TEXT[] NOT NULL DEFAULT '{}',
  internal_notes TEXT NOT NULL DEFAULT '',
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_customers_phone_workspace UNIQUE (phone_normalized, is_demo)
);

CREATE INDEX IF NOT EXISTS idx_customers_phone_normalized ON public.customers (phone_normalized);
CREATE INDEX IF NOT EXISTS idx_customers_is_demo ON public.customers (is_demo);

-- 2. Reservations
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  external_event_id TEXT UNIQUE,
  customer_name TEXT NOT NULL CHECK (char_length(trim(customer_name)) >= 1),
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  guest_city TEXT,
  reservation_date DATE NOT NULL,
  reservation_time TEXT NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count >= 1 AND guest_count <= 500),
  seating_preference TEXT NOT NULL DEFAULT 'no-preference'
    CHECK (seating_preference IN ('rooftop', 'indoor', 'no-preference')),
  special_occasion TEXT,
  special_requests TEXT,
  dietary_requirements TEXT,
  source TEXT NOT NULL DEFAULT 'website'
    CHECK (source IN ('website', 'whatsapp_ai', 'manual', 'web_ai_demo')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'seated', 'completed', 'no_show')),
  conversation_id TEXT,
  manager_notes TEXT NOT NULL DEFAULT '',
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_outbound_notification_status TEXT DEFAULT 'not_configured',
  last_outbound_event_id TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations (reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations (status);
CREATE INDEX IF NOT EXISTS idx_reservations_source ON public.reservations (source);
CREATE INDEX IF NOT EXISTS idx_reservations_is_demo ON public.reservations (is_demo);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON public.reservations (customer_id);

-- 3. AI Conversations (monitored from n8n + WhatsApp AI / Web AI Demo)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_session_id TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_identifier TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'whatsapp_ai'
    CHECK (source IN ('whatsapp_ai', 'web_ai_demo')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'reservation_requested', 'awaiting_manager', 'human_handover_requested', 'resolved')),
  detected_intent TEXT NOT NULL DEFAULT 'general_inquiry',
  linked_reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  response_latency_ms INTEGER,
  needs_human_assistance BOOLEAN NOT NULL DEFAULT FALSE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations (status);
CREATE INDEX IF NOT EXISTS idx_conversations_is_demo ON public.conversations (is_demo);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations (last_message_at DESC);

-- 4. Conversation Messages
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  external_message_id TEXT UNIQUE,
  sender TEXT NOT NULL CHECK (sender IN ('customer', 'assistant', 'system')),
  content TEXT NOT NULL,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_messages_conversation ON public.conversation_messages (conversation_id, created_at ASC);

-- 5. In-App Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'new_website_reservation',
    'new_whatsapp_ai_reservation',
    'new_web_ai_demo_reservation',
    'pending_booking_approval',
    'cancellation_requested',
    'reschedule_requested',
    'human_assistance_requested',
    'special_occasion_booking',
    'automation_integration_error'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (is_demo, is_read, created_at DESC);

-- 6. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('reservation', 'conversation', 'customer', 'settings', 'integration')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs (is_demo, created_at DESC);

-- 7. Restaurant Availability & Operational Settings
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  operating_days TEXT[] NOT NULL DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  opening_time TEXT,
  closing_time TEXT,
  hours_configured BOOLEAN NOT NULL DEFAULT FALSE,
  time_slots TEXT[] NOT NULL DEFAULT ARRAY['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
  reservation_duration_minutes INTEGER NOT NULL DEFAULT 120 CHECK (reservation_duration_minutes BETWEEN 30 AND 360),
  rooftop_capacity INTEGER CHECK (rooftop_capacity IS NULL OR rooftop_capacity > 0),
  indoor_capacity INTEGER CHECK (indoor_capacity IS NULL OR indoor_capacity > 0),
  max_guest_count INTEGER CHECK (max_guest_count IS NULL OR max_guest_count > 0),
  capacity_configured BOOLEAN NOT NULL DEFAULT FALSE,
  capacity_is_sample BOOLEAN NOT NULL DEFAULT FALSE,
  closure_dates TEXT[] NOT NULL DEFAULT '{}',
  require_manager_approval BOOLEAN NOT NULL DEFAULT TRUE,
  n8n_outbound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Integration Events (audit log & deduplication for n8n)
CREATE TABLE IF NOT EXISTS public.integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'n8n',
  status TEXT NOT NULL CHECK (status IN ('success', 'duplicate', 'failed', 'not_configured')),
  http_status INTEGER,
  summary TEXT NOT NULL,
  error_message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_events_created ON public.integration_events (created_at DESC);

-- Automatically maintain updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_updated ON public.customers;
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reservations_updated ON public.reservations;
CREATE TRIGGER trg_reservations_updated BEFORE UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_conversations_updated ON public.conversations;
CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_settings_updated ON public.restaurant_settings;
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.restaurant_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row Level Security: block anonymous public reads/writes; allow server service_role or authenticated manager role
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically; explicit authenticated manager policy for direct Supabase JWT access:
CREATE POLICY "Managers only customers" ON public.customers
  FOR ALL USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'role') = 'manager');

CREATE POLICY "Managers only reservations" ON public.reservations
  FOR ALL USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'role') = 'manager');

CREATE POLICY "Managers only conversations" ON public.conversations
  FOR ALL USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'role') = 'manager');

CREATE POLICY "Managers only messages" ON public.conversation_messages
  FOR ALL USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'role') = 'manager');

CREATE POLICY "Managers only notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'role') = 'manager');

CREATE POLICY "Managers only activity_logs" ON public.activity_logs
  FOR ALL USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'role') = 'manager');

CREATE POLICY "Managers only settings" ON public.restaurant_settings
  FOR ALL USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'role') = 'manager');

CREATE POLICY "Managers only integration_events" ON public.integration_events
  FOR ALL USING (auth.role() = 'authenticated' AND (auth.jwt() ->> 'role') = 'manager');
