import crypto from 'crypto';
import type { Express, Request, Response, NextFunction } from 'express';
import {
  claimFirstRunManagerPasscode,
  getAdminAuthStatus,
  getKarachiDateAndTime,
  getN8nChatProxyConfig,
  issueManagerBearerToken,
  repository,
  verifyManagerBearerToken,
  verifyManagerPasscode,
  verifyN8nBearerToken,
} from './repository.ts';
import type {
  ConversationStatus,
  ManagementSeating,
  ReservationSource,
  ReservationStatus,
} from '../src/types/management.ts';

const VALID_SOURCES: ReservationSource[] = ['website', 'whatsapp_ai', 'manual', 'web_ai_demo'];
const VALID_STATUSES: ReservationStatus[] = [
  'pending',
  'confirmed',
  'rejected',
  'cancelled',
  'seated',
  'completed',
  'no_show',
];
const VALID_SEATING: ManagementSeating[] = ['rooftop', 'indoor', 'no-preference'];
const VALID_CONV_STATUSES: ConversationStatus[] = [
  'active',
  'reservation_requested',
  'awaiting_manager',
  'human_handover_requested',
  'resolved',
];

function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return /^[+\d\s().-]+$/.test(raw.trim()) && digits.length >= 7 && digits.length <= 15;
}

function isValidDateStr(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

// Rate limiter for public-facing reservation & demo chat endpoints
const publicRateBuckets = new Map<string, number[]>();
function checkPublicRateLimit(ip: string, maxRequests = 40): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const entries = (publicRateBuckets.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (entries.length >= maxRequests) {
    publicRateBuckets.set(ip, entries);
    return false;
  }
  entries.push(now);
  publicRateBuckets.set(ip, entries);
  return true;
}

function requireN8nAuth(req: Request, res: Response, next: NextFunction) {
  const check = verifyN8nBearerToken(req.headers.authorization);
  if (!check.configured) {
    res.status(503).json({
      ok: false,
      error: 'n8n_secret_not_configured',
      message: 'N8N_INTEGRATION_SECRET is not configured on the server.',
    });
    return;
  }
  if (!check.ok) {
    res.status(401).json({
      ok: false,
      error: 'unauthorized',
      message: 'Valid Authorization Bearer token is required.',
    });
    return;
  }
  next();
}

function requireManagerAuth(req: Request, res: Response, next: NextFunction) {
  if (!verifyManagerBearerToken(req.headers.authorization)) {
    res.status(401).json({
      ok: false,
      error: 'unauthorized',
      message: 'Manager authentication is required for production endpoints.',
    });
    return;
  }
  next();
}

function validateNewReservationPayload(
  body: Record<string, unknown>,
  forcedSource?: ReservationSource
): { error?: string; data?: Parameters<typeof repository.createReservation>[0] } {
  const customerName = String(body.customer_name ?? body.customerName ?? '').trim().slice(0, 100);
  const customerPhone = String(body.customer_phone ?? body.customerPhone ?? '').trim().slice(0, 30);
  const customerEmail = String(body.customer_email ?? body.customerEmail ?? '').trim().slice(0, 120);
  const guestCity = String(body.guest_city ?? body.guestCity ?? '').trim().slice(0, 80);
  const reservationDate = String(body.reservation_date ?? body.reservationDate ?? '').trim();
  const reservationTime = String(body.reservation_time ?? body.reservationTime ?? '').trim().slice(0, 60);
  const guestCount = Number(body.guest_count ?? body.guestCount);
  const seatingRaw = String(body.seating_preference ?? body.seatingPreference ?? 'no-preference').trim();
  const specialOccasion = String(body.special_occasion ?? body.specialOccasion ?? '').trim().slice(0, 80);
  const specialRequests = String(body.special_requests ?? body.specialRequests ?? '').trim().slice(0, 500);
  const dietaryRequirements = String(body.dietary_requirements ?? body.dietaryRequirements ?? '').trim().slice(0, 300);
  const sourceRaw = forcedSource ?? (String(body.source ?? 'website').trim() as ReservationSource);
  const externalEventId = body.external_event_id ?? body.externalEventId;
  const conversationId = body.conversation_id ?? body.conversationId;
  const managerNotes = String(body.manager_notes ?? body.managerNotes ?? '').trim().slice(0, 500);

  if (!customerName) return { error: 'customer_name is required.' };
  if (!customerPhone || !isValidPhone(customerPhone)) {
    return { error: 'customer_phone must contain 7 to 15 digits.' };
  }
  if (!isValidDateStr(reservationDate)) {
    return { error: 'reservation_date must be YYYY-MM-DD.' };
  }
  if (!reservationTime) {
    return { error: 'reservation_time is required.' };
  }
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 500) {
    return { error: 'guest_count must be an integer between 1 and 500.' };
  }
  if (!VALID_SEATING.includes(seatingRaw as ManagementSeating)) {
    return { error: 'seating_preference must be rooftop, indoor, or no-preference.' };
  }
  if (!VALID_SOURCES.includes(sourceRaw)) {
    return { error: 'source must be website, whatsapp_ai, manual, or web_ai_demo.' };
  }

  return {
    data: {
      externalEventId: externalEventId ? String(externalEventId).trim().slice(0, 120) : null,
      customerName,
      customerPhone,
      customerEmail,
      guestCity,
      reservationDate,
      reservationTime,
      guestCount,
      seatingPreference: seatingRaw as ManagementSeating,
      specialOccasion,
      specialRequests,
      dietaryRequirements,
      source: sourceRaw,
      conversationId: conversationId ? String(conversationId).trim().slice(0, 120) : null,
      managerNotes,
      isDemo: Boolean(body.is_demo ?? body.isDemo),
      actor:
        sourceRaw === 'whatsapp_ai'
          ? 'WhatsApp AI Agent'
          : sourceRaw === 'web_ai_demo'
            ? 'Web AI Demo'
            : sourceRaw === 'manual'
              ? 'Manager Manual Entry'
              : 'Public Website Form',
    },
  };
}

// Simulated session tracker when user explicitly opts into "Simulated Demo"
interface SimSessionState {
  guests?: number;
  date?: string;
  time?: string;
  seating?: ManagementSeating;
  name?: string;
  phone?: string;
  savedRef?: string;
}
const simulatedSessions = new Map<string, SimSessionState>();

async function runExplicitSimulatedDemoReply(
  sessionId: string,
  userMessage: string
): Promise<{ reply: string; bookingReference?: string }> {
  const state = simulatedSessions.get(sessionId) || {};
  const lower = userMessage.toLowerCase();
  const { dateStr } = getKarachiDateAndTime();

  // Extract simple cues from user message
  const guestMatch = userMessage.match(/\b(\d{1,2})\s*(guests?|people|persons?|of us|pax)?\b/i);
  if (guestMatch && !userMessage.includes('+') && Number(guestMatch[1]) >= 1 && Number(guestMatch[1]) <= 60) {
    if (!/\b(pm|am|:00)\b/i.test(guestMatch[0])) {
      state.guests = Number(guestMatch[1]);
    }
  }
  if (lower.includes('rooftop') || lower.includes('terrace')) state.seating = 'rooftop';
  if (lower.includes('indoor')) state.seating = 'indoor';
  if (lower.includes('tomorrow')) {
    const [y, m, d] = dateStr.split('-').map(Number);
    state.date = new Date(Date.UTC(y, m - 1, d + 1, 12)).toISOString().slice(0, 10);
  } else if (lower.includes('today') || lower.includes('tonight')) {
    state.date = dateStr;
  } else if (lower.includes('friday')) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12));
    const diff = (5 - dt.getUTCDay() + 7) % 7 || 7;
    dt.setUTCDate(dt.getUTCDate() + diff);
    state.date = dt.toISOString().slice(0, 10);
  }
  const timeMatch = userMessage.match(/\b(5|6|7|8|9|10)\s*(?::00)?\s*pm\b/i);
  if (timeMatch) {
    const hr = Number(timeMatch[1]) + 12;
    state.time = `${hr}:00`;
  }
  const phoneMatch = userMessage.match(/(\+?\d[\d\s-]{7,15}\d)/);
  if (phoneMatch) {
    state.phone = phoneMatch[1].trim();
  }
  const nameMatch = userMessage.match(/(?:name is|under|i am|this is)\s+([A-Za-z][A-Za-z\s]{1,40})/i);
  if (nameMatch) {
    state.name = nameMatch[1].trim().replace(/[.,]+$/, '');
  }

  simulatedSessions.set(sessionId, state);

  if (state.savedRef) {
    return {
      reply: `[Simulated Demo] Your demonstration request (${state.savedRef}) is already logged as Pending in the Demo Dashboard. Would you like to reset the session to test another enquiry?`,
      bookingReference: state.savedRef,
    };
  }

  if (!state.guests || !state.time || !state.date) {
    const missing: string[] = [];
    if (!state.date) missing.push('preferred date');
    if (!state.time) missing.push('arrival time (5:00 PM – 10:00 PM)');
    if (!state.guests) missing.push('party size');
    return {
      reply: `[Simulated Demo] Assalam-o-Alaikum. I can help prepare a demonstration table request for Andaaz Restaurant on Fort Road, Lahore. Please share your ${missing.join(', ')}, along with any rooftop or indoor preference.`,
    };
  }

  if (!state.name || !state.phone) {
    return {
      reply: `[Simulated Demo] Noted: ${state.guests} guests on ${state.date} at ${state.time} (${state.seating || 'no seating preference'}). To log this Pending demo reservation for manager review, please share a fictional guest name and synthetic contact number (e.g. "Ali Demo, +92 300 0000999").`,
    };
  }

  const created = await repository.createReservation({
    externalEventId: `sim-demo-${sessionId}`,
    customerName: `${state.name} (Sim Demo)`,
    customerPhone: state.phone,
    guestCity: 'Lahore',
    reservationDate: state.date,
    reservationTime: state.time,
    guestCount: state.guests,
    seatingPreference: state.seating || 'no-preference',
    specialOccasion: lower.includes('anniversary') ? 'Anniversary Dinner' : '',
    specialRequests: 'Created via explicitly labeled Simulated Demo mode.',
    source: 'web_ai_demo',
    conversationId: sessionId,
    isDemo: true,
    actor: 'Simulated Web AI Demo',
  });

  state.savedRef = created.reservation.bookingReference;
  simulatedSessions.set(sessionId, state);

  return {
    reply: `[Simulated Demo] Thank you, ${state.name}. Your demonstration request (${created.reservation.bookingReference}) has been saved with Pending status and an in-app notification was sent to the Demo Manager Dashboard. Note: availability always requires manager confirmation.`,
    bookingReference: created.reservation.bookingReference,
  };
}

function extractTextFromN8nNode(node: unknown): {
  reply: string | null;
  bookingReference: string | null;
} {
  if (typeof node === 'string') {
    const trimmed = node.trim();
    return { reply: trimmed || null, bookingReference: null };
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const nested = extractTextFromN8nNode(item);
      if (nested.reply) return nested;
    }
    return { reply: null, bookingReference: null };
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const bookingRefRaw = obj.booking_reference ?? obj.bookingReference;
    const bookingReference =
      typeof bookingRefRaw === 'string' && bookingRefRaw.trim()
        ? bookingRefRaw.trim()
        : null;

    for (const key of ['output', 'text', 'reply', 'message', 'response', 'answer', 'content']) {
      const val = obj[key];
      if (typeof val === 'string' && val.trim()) {
        return { reply: val.trim(), bookingReference };
      }
    }

    if (obj.json) {
      const nested = extractTextFromN8nNode(obj.json);
      if (nested.reply) {
        return {
          reply: nested.reply,
          bookingReference: bookingReference || nested.bookingReference,
        };
      }
    }
    if (obj.data) {
      const nested = extractTextFromN8nNode(obj.data);
      if (nested.reply) {
        return {
          reply: nested.reply,
          bookingReference: bookingReference || nested.bookingReference,
        };
      }
    }
    if (Array.isArray(obj.messages) && obj.messages.length > 0) {
      const lastMsg = obj.messages[obj.messages.length - 1];
      const nested = extractTextFromN8nNode(lastMsg);
      if (nested.reply) {
        return {
          reply: nested.reply,
          bookingReference: bookingReference || nested.bookingReference,
        };
      }
    }
    return { reply: null, bookingReference };
  }
  return { reply: null, bookingReference: null };
}

function extractN8nChatResponse(rawText: string): {
  reply: string;
  bookingReference: string | null;
} {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { reply: '', bookingReference: null };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const extracted = extractTextFromN8nNode(parsed);
    if (extracted.reply) {
      return {
        reply: extracted.reply,
        bookingReference: extracted.bookingReference,
      };
    }
  } catch {
    // Check if n8n returned streaming NDJSON chunks (one JSON object per line)
    const lines = trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 1 && lines.every((l) => l.startsWith('{'))) {
      let combined = '';
      let bookingReference: string | null = null;
      for (const line of lines) {
        try {
          const item = JSON.parse(line) as Record<string, unknown>;
          if (item.type === 'item' && typeof item.content === 'string') {
            combined += item.content;
          } else {
            const nested = extractTextFromN8nNode(item);
            if (nested.reply && item.type !== 'begin' && item.type !== 'end') {
              combined += nested.reply;
            }
            if (nested.bookingReference) bookingReference = nested.bookingReference;
          }
        } catch {
          // Ignore malformed chunk line
        }
      }
      if (combined.trim()) {
        return { reply: combined.trim(), bookingReference };
      }
    }
  }

  return { reply: trimmed, bookingReference: null };
}

export function registerManagementApiRoutes(app: Express) {
  // 1. PUBLIC WEBSITE RESERVATION SUBMISSION (persists Pending request, returns ref only)
  app.post('/api/public/reservations', async (req, res) => {
    const clientIp = req.ip || 'unknown';
    if (!checkPublicRateLimit(clientIp, 30)) {
      res.status(429).json({
        ok: false,
        error: 'rate_limited',
        message: 'Too many requests in a short window. Please wait a moment or contact +92 300 0263229.',
      });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const storageMode = repository.getStorageMode();
    // In demo_memory preview mode without Supabase, persist into the isolated demo workspace so preview tests reflect cleanly in /staff-demo.
    const isDemoRecord = storageMode === 'demo_memory' ? true : Boolean(body.isDemo);
    const parsed = validateNewReservationPayload(
      { ...body, source: 'website', isDemo: isDemoRecord },
      'website'
    );
    if (parsed.error || !parsed.data) {
      res.status(400).json({ ok: false, error: 'validation_error', message: parsed.error });
      return;
    }

    try {
      const { reservation, duplicate } = await repository.createReservation(parsed.data);
      res.status(duplicate ? 200 : 201).json({
        ok: true,
        duplicate,
        bookingReference: reservation.bookingReference,
        status: reservation.status,
        storageMode,
        message:
          'Your reservation request has been recorded with Pending status. Please continue on WhatsApp or await restaurant confirmation.',
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Could not store reservation request.',
      });
    }
  });

  // 2. N8N SERVER-SIDE INTEGRATION CONTRACTS
  app.get('/api/integrations/n8n/health', (_req, res) => {
    const karachi = getKarachiDateAndTime();
    const authConfigured = Boolean((process.env.N8N_INTEGRATION_SECRET || '').trim());
    res.json({
      ok: true,
      service: 'andaaz-n8n-integration',
      storageMode: repository.getStorageMode(),
      authConfigured,
      karachiDate: karachi.dateStr,
      karachiTime: karachi.timeStr,
    });
  });

  app.get('/api/integrations/n8n/availability', async (req, res) => {
    try {
      const settings = await repository.getSettings();
      const requestedDate = typeof req.query.date === 'string' ? req.query.date.trim() : '';
      const requestedDateClosed =
        Boolean(requestedDate) && settings.closureDates.includes(requestedDate);

      res.json({
        ok: true,
        timezone: 'Asia/Karachi',
        advisoryOnly: true,
        requireManagerApproval: settings.requireManagerApproval,
        hoursConfigured: settings.hoursConfigured,
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        operatingDays: settings.operatingDays,
        timeSlots: settings.timeSlots,
        reservationDurationMinutes: settings.reservationDurationMinutes,
        capacityConfigured: settings.capacityConfigured,
        capacityIsSample: settings.capacityIsSample,
        rooftopCapacity: settings.capacityConfigured ? settings.rooftopCapacity : null,
        indoorCapacity: settings.capacityConfigured ? settings.indoorCapacity : null,
        maxGuestCount: settings.maxGuestCount,
        closureDates: settings.closureDates,
        ...(requestedDate ? { requestedDate, requestedDateClosed } : {}),
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Could not load availability settings.',
      });
    }
  });

  app.post('/api/integrations/n8n/reservations', requireN8nAuth, async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const parsed = validateNewReservationPayload({
      ...body,
      source: body.source || 'whatsapp_ai',
    });

    if (parsed.error || !parsed.data) {
      await repository.recordIntegrationEvent({
        externalEventId: body.external_event_id ? String(body.external_event_id) : null,
        eventType: 'reservation.validation_failed',
        source: 'n8n',
        status: 'failed',
        httpStatus: 400,
        summary: 'Rejected invalid reservation payload from n8n.',
        errorMessage: parsed.error || 'Validation failed',
        isDemo: Boolean(body.is_demo),
      });
      res.status(400).json({ ok: false, error: 'validation_error', message: parsed.error });
      return;
    }

    try {
      const { reservation, duplicate } = await repository.createReservation(parsed.data);
      await repository.recordIntegrationEvent({
        externalEventId: reservation.externalEventId
          ? `ingest-${reservation.externalEventId}`
          : null,
        eventType: duplicate ? 'reservation.duplicate_ignored' : 'reservation.ingested',
        source: reservation.source,
        status: duplicate ? 'duplicate' : 'success',
        httpStatus: duplicate ? 200 : 201,
        summary: duplicate
          ? `Duplicate external_event_id ignored for ${reservation.bookingReference}.`
          : `Saved ${reservation.bookingReference} (${reservation.status}) via n8n.`,
        errorMessage: null,
        isDemo: reservation.isDemo,
      });

      res.status(duplicate ? 200 : 201).json({
        ok: true,
        duplicate,
        reservation: {
          id: reservation.id,
          booking_reference: reservation.bookingReference,
          status: reservation.status,
          source: reservation.source,
          is_demo: reservation.isDemo,
          created_at: reservation.createdAt,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Database write error';
      await repository.recordIntegrationEvent({
        eventType: 'reservation.ingest_failed',
        source: 'n8n',
        status: 'failed',
        httpStatus: 500,
        summary: 'Failed to store n8n reservation.',
        errorMessage: msg,
        isDemo: Boolean(body.is_demo),
      });
      res.status(500).json({ ok: false, error: 'persistence_error', message: msg });
    }
  });

  app.post('/api/integrations/n8n/conversations', requireN8nAuth, async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const externalSessionId = String(body.external_session_id ?? '').trim().slice(0, 120);
    const customerIdentifier = String(body.customer_identifier ?? '').trim().slice(0, 80);
    if (!externalSessionId || !customerIdentifier) {
      res.status(400).json({
        ok: false,
        error: 'validation_error',
        message: 'external_session_id and customer_identifier are required.',
      });
      return;
    }

    const source = body.source === 'web_ai_demo' ? 'web_ai_demo' : 'whatsapp_ai';
    const rawStatus = String(body.status ?? 'active');
    const status = VALID_CONV_STATUSES.includes(rawStatus as ConversationStatus)
      ? (rawStatus as ConversationStatus)
      : 'active';

    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMessages
      .filter((m): m is Record<string, unknown> => Boolean(m && typeof m === 'object' && m.content))
      .map((m) => ({
        externalMessageId: m.external_message_id ? String(m.external_message_id) : null,
        sender: (['customer', 'assistant', 'system'].includes(String(m.sender))
          ? String(m.sender)
          : 'assistant') as 'customer' | 'assistant' | 'system',
        content: String(m.content).slice(0, 2000),
        latencyMs: m.latency_ms ? Number(m.latency_ms) : null,
        createdAt: m.created_at ? String(m.created_at) : undefined,
      }));

    try {
      const conv = await repository.upsertConversation({
        externalSessionId,
        customerIdentifier,
        customerName: body.customer_name ? String(body.customer_name).slice(0, 100) : undefined,
        source,
        status,
        detectedIntent: body.detected_intent ? String(body.detected_intent).slice(0, 80) : undefined,
        linkedReservationId: body.linked_reservation_id
          ? String(body.linked_reservation_id)
          : undefined,
        responseLatencyMs: body.response_latency_ms ? Number(body.response_latency_ms) : undefined,
        needsHumanAssistance:
          typeof body.needs_human_assistance === 'boolean'
            ? body.needs_human_assistance
            : undefined,
        isDemo: Boolean(body.is_demo),
        messages,
      });

      res.status(200).json({
        ok: true,
        conversation: {
          id: conv.id,
          external_session_id: conv.externalSessionId,
          status: conv.status,
          message_count: conv.messages.length,
        },
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Could not record conversation.',
      });
    }
  });

  app.post('/api/integrations/n8n/events', requireN8nAuth, async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const eventType = String(body.event_type ?? '').trim().slice(0, 100);
    const summary = String(body.summary ?? '').trim().slice(0, 400);
    if (!eventType || !summary) {
      res.status(400).json({
        ok: false,
        error: 'validation_error',
        message: 'event_type and summary are required.',
      });
      return;
    }

    const status = (['success', 'duplicate', 'failed', 'not_configured'].includes(
      String(body.status)
    )
      ? String(body.status)
      : 'success') as 'success' | 'duplicate' | 'failed' | 'not_configured';

    const { event, duplicate } = await repository.recordIntegrationEvent({
      externalEventId: body.external_event_id ? String(body.external_event_id) : null,
      eventType,
      source: String(body.source ?? 'n8n').slice(0, 60),
      status,
      httpStatus: body.http_status ? Number(body.http_status) : null,
      summary,
      errorMessage: body.error_message ? String(body.error_message).slice(0, 300) : null,
      isDemo: Boolean(body.is_demo),
    });

    res.status(duplicate ? 200 : 201).json({ ok: true, duplicate, event });
  });

  // 3. N8N CHAT PROXY CONTRACT FOR /automation-demo
  app.post('/api/ai-concierge/chat', async (req, res) => {
    const clientIp = req.ip || 'unknown';
    if (!checkPublicRateLimit(clientIp, 40)) {
      res.status(429).json({
        ok: false,
        error: 'rate_limited',
        message: 'Too many demo chat messages. Please wait a moment.',
      });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const sessionId = String(body.sessionId ?? '').trim().slice(0, 120);
    const message = String(body.message ?? '').trim();
    const allowSimulated = Boolean(body.allowSimulated);

    if (!sessionId || !message || message.length > 1000) {
      res.status(400).json({
        ok: false,
        error: 'validation_error',
        message: 'sessionId and non-empty message (<= 1000 characters) are required.',
      });
      return;
    }

    const chatConfig = getN8nChatProxyConfig();

    if (!chatConfig.chatUrl) {
      if (!allowSimulated) {
        res.status(503).json({
          ok: false,
          error: 'n8n_not_configured',
          message:
            'Live n8n Chat Webhook is not configured on the server (N8N_CHAT_WEBHOOK_URL). You can enable the explicitly labeled Simulated Demo mode below to test the workflow.',
        });
        return;
      }

      const started = Date.now();
      try {
        const sim = await runExplicitSimulatedDemoReply(sessionId, message);
        const latency = Math.max(240, Date.now() - started + 280);

        await repository.upsertConversation({
          externalSessionId: sessionId,
          customerIdentifier: `Web AI Demo (${sessionId.slice(-6)})`,
          customerName: 'Web AI Demo Visitor',
          source: 'web_ai_demo',
          status: sim.bookingReference ? 'awaiting_manager' : 'active',
          detectedIntent: 'simulated_demo_inquiry',
          responseLatencyMs: latency,
          isDemo: true,
          messages: [
            {
              externalMessageId: `sim-u-${crypto.randomUUID()}`,
              sender: 'customer',
              content: message,
            },
            {
              externalMessageId: `sim-a-${crypto.randomUUID()}`,
              sender: 'assistant',
              content: sim.reply,
              latencyMs: latency,
            },
          ],
        });

        res.json({
          ok: true,
          mode: 'simulated_demo',
          simulated: true,
          sessionId,
          reply: sim.reply,
          bookingReference: sim.bookingReference || null,
          latencyMs: latency,
        });
      } catch (err) {
        res.status(500).json({
          ok: false,
          error: 'persistence_error',
          message: err instanceof Error ? err.message : 'Database error storing simulated chat.',
        });
      }
      return;
    }

    if (chatConfig.basicAuthIncomplete) {
      console.error(
        '[n8n:chat_proxy] Incomplete Basic Auth configuration: N8N_CHAT_USERNAME and N8N_CHAT_PASSWORD must both be set.'
      );
      await repository.recordIntegrationEvent({
        eventType: 'n8n.chat_proxy.auth_misconfigured',
        source: 'web_ai_demo',
        status: 'failed',
        httpStatus: 503,
        summary: 'Incomplete n8n Chat Basic Auth credentials on server.',
        errorMessage:
          'Both N8N_CHAT_USERNAME and N8N_CHAT_PASSWORD must be configured.',
        isDemo: true,
      });
      res.status(503).json({
        ok: false,
        error: 'n8n_auth_misconfigured',
        message:
          'Server Basic Auth credentials for n8n Chat are incomplete. Configure both N8N_CHAT_USERNAME and N8N_CHAT_PASSWORD.',
      });
      return;
    }

    // Live server-side forwarding to configured n8n Embedded Chat Trigger URL
    const startedAt = Date.now();
    try {
      const parsedUrl = new URL(chatConfig.chatUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid N8N_CHAT_WEBHOOK_URL protocol');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
      };
      if (chatConfig.authHeader) {
        headers.Authorization = chatConfig.authHeader;
      }

      const upstream = await fetch(parsedUrl.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId,
          chatInput: message,
          source: 'web_ai_demo',
          is_demo: true,
        }),
        signal: AbortSignal.timeout(25000),
      });

      const latencyMs = Date.now() - startedAt;
      const rawText = await upstream.text();

      if (!upstream.ok) {
        const isAuthFailure = upstream.status === 401 || upstream.status === 403;
        const isNotFound = upstream.status === 404;
        const safeErrDetail = isAuthFailure
          ? `n8n Chat Trigger authentication failed (HTTP ${upstream.status}).`
          : isNotFound
            ? 'n8n Chat webhook URL not found (HTTP 404).'
            : `n8n Chat Webhook returned HTTP ${upstream.status}.`;
        console.error(`[n8n:chat_proxy] ${safeErrDetail}`);

        await repository.recordIntegrationEvent({
          eventType: isAuthFailure
            ? 'n8n.chat_proxy.auth_failed'
            : 'n8n.chat_proxy.failed',
          source: 'web_ai_demo',
          status: 'failed',
          httpStatus: upstream.status,
          summary: safeErrDetail,
          errorMessage: isAuthFailure
            ? 'Verify N8N_CHAT_USERNAME and N8N_CHAT_PASSWORD match the n8n Chat Trigger settings.'
            : rawText.slice(0, 180) || safeErrDetail,
          isDemo: true,
        });

        res.status(502).json({
          ok: false,
          error: isAuthFailure
            ? 'n8n_auth_failed'
            : isNotFound
              ? 'n8n_not_found'
              : 'n8n_upstream_error',
          message: isAuthFailure
            ? `n8n Chat authentication failed (HTTP ${upstream.status}). Please verify N8N_CHAT_USERNAME and N8N_CHAT_PASSWORD on the server.`
            : isNotFound
              ? 'n8n Chat webhook returned HTTP 404. Please verify N8N_CHAT_WEBHOOK_URL and ensure the workflow is active.'
              : `The n8n AI endpoint returned HTTP ${upstream.status}. Please verify the n8n workflow.`,
        });
        return;
      }

      const parsedReply = extractN8nChatResponse(rawText);
      if (!parsedReply.reply) {
        await repository.recordIntegrationEvent({
          eventType: 'n8n.chat_proxy.empty_reply',
          source: 'web_ai_demo',
          status: 'failed',
          httpStatus: upstream.status,
          summary: 'n8n Chat Trigger returned HTTP 200 without reply text.',
          errorMessage: 'Empty response body from n8n workflow.',
          isDemo: true,
        });
        res.status(502).json({
          ok: false,
          error: 'n8n_empty_response',
          message:
            'The n8n AI endpoint responded without message text. Please verify the AI Agent / Chat Trigger response node.',
        });
        return;
      }

      await repository.upsertConversation({
        externalSessionId: sessionId,
        customerIdentifier: `Web AI Demo (${sessionId.slice(-6)})`,
        customerName: 'Web AI Demo Visitor',
        source: 'web_ai_demo',
        status: parsedReply.bookingReference ? 'reservation_requested' : 'active',
        detectedIntent: 'live_n8n_chat',
        responseLatencyMs: latencyMs,
        isDemo: true,
        messages: [
          {
            externalMessageId: `live-u-${crypto.randomUUID()}`,
            sender: 'customer',
            content: message,
          },
          {
            externalMessageId: `live-a-${crypto.randomUUID()}`,
            sender: 'assistant',
            content: parsedReply.reply,
            latencyMs,
          },
        ],
      });

      res.json({
        ok: true,
        mode: 'live_n8n',
        simulated: false,
        sessionId,
        reply: parsedReply.reply,
        bookingReference: parsedReply.bookingReference,
        latencyMs,
      });
    } catch (err) {
      const isTimeout =
        err instanceof Error &&
        (err.name === 'TimeoutError' || err.name === 'AbortError');
      const rawMsg = err instanceof Error ? err.message : 'n8n connection failed';
      const safeMsg = isTimeout
        ? 'Request to n8n AI agent timed out after 25 seconds.'
        : rawMsg.replace(/https?:\/\/[^\s'"]+/gi, '[N8N_WEBHOOK]');
      console.error(`[n8n:chat_proxy] ${safeMsg}`);

      await repository.recordIntegrationEvent({
        eventType: isTimeout
          ? 'n8n.chat_proxy.timeout'
          : 'n8n.chat_proxy.error',
        source: 'web_ai_demo',
        status: 'failed',
        httpStatus: isTimeout ? 504 : 502,
        summary: isTimeout
          ? 'n8n Chat Trigger timed out.'
          : 'Failed to reach n8n chat webhook.',
        errorMessage: safeMsg,
        isDemo: true,
      });
      res.status(isTimeout ? 504 : 502).json({
        ok: false,
        error: isTimeout ? 'n8n_timeout' : 'n8n_unreachable',
        message: isTimeout
          ? 'The n8n AI agent timed out while generating a reply. Please try again or check the workflow execution logs.'
          : `Could not connect to the n8n chat endpoint (${safeMsg}).`,
      });
    }
  });

  // 4. ISOLATED DEMO WORKSPACE ENDPOINTS (/api/demo/* -> isDemo: true ONLY)
  app.get('/api/demo/workspace', async (_req, res) => {
    try {
      const snapshot = await repository.getWorkspaceSnapshot(true);
      res.json({ ok: true, snapshot });
    } catch (err) {
      res.status(500).json({
        ok: false,
        message: err instanceof Error ? err.message : 'Failed to load demo workspace.',
      });
    }
  });

  app.post('/api/demo/reservations', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const parsed = validateNewReservationPayload({ ...body, isDemo: true });
    if (parsed.error || !parsed.data) {
      res.status(400).json({ ok: false, error: 'validation_error', message: parsed.error });
      return;
    }
    try {
      const result = await repository.createReservation({ ...parsed.data, isDemo: true });
      res.status(result.duplicate ? 200 : 201).json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({
        ok: false,
        message: err instanceof Error ? err.message : 'Could not create reservation.',
      });
    }
  });

  app.patch('/api/demo/reservations/:id', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    if (body.status !== undefined && !VALID_STATUSES.includes(String(body.status) as ReservationStatus)) {
      res.status(400).json({ ok: false, message: 'Invalid reservation status.' });
      return;
    }
    if (
      body.seatingPreference !== undefined &&
      !VALID_SEATING.includes(String(body.seatingPreference) as ManagementSeating)
    ) {
      res.status(400).json({ ok: false, message: 'Invalid seating preference.' });
      return;
    }
    if (body.guestCount !== undefined) {
      const gc = Number(body.guestCount);
      if (!Number.isInteger(gc) || gc < 1 || gc > 500) {
        res.status(400).json({ ok: false, message: 'Guest count must be between 1 and 500.' });
        return;
      }
    }

    try {
      const updated = await repository.updateReservation(String(req.params.id), true, {
        customerName: typeof body.customerName === 'string' ? body.customerName : undefined,
        customerPhone: typeof body.customerPhone === 'string' ? body.customerPhone : undefined,
        customerEmail: typeof body.customerEmail === 'string' ? body.customerEmail : undefined,
        guestCity: typeof body.guestCity === 'string' ? body.guestCity : undefined,
        reservationDate:
          typeof body.reservationDate === 'string' && isValidDateStr(body.reservationDate)
            ? body.reservationDate
            : undefined,
        reservationTime:
          typeof body.reservationTime === 'string' ? body.reservationTime : undefined,
        guestCount: body.guestCount !== undefined ? Number(body.guestCount) : undefined,
        seatingPreference: body.seatingPreference as ManagementSeating | undefined,
        specialOccasion:
          typeof body.specialOccasion === 'string' ? body.specialOccasion : undefined,
        specialRequests:
          typeof body.specialRequests === 'string' ? body.specialRequests : undefined,
        dietaryRequirements:
          typeof body.dietaryRequirements === 'string' ? body.dietaryRequirements : undefined,
        status: body.status as ReservationStatus | undefined,
        managerNotes: typeof body.managerNotes === 'string' ? body.managerNotes : undefined,
        actionNote: typeof body.actionNote === 'string' ? body.actionNote : undefined,
        actor: 'Demo Manager',
      });

      if (!updated) {
        res.status(404).json({ ok: false, message: 'Reservation not found in demo workspace.' });
        return;
      }
      res.json({ ok: true, reservation: updated });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Could not update reservation.',
      });
    }
  });

  app.post('/api/demo/reservations/:id/retry-notification', async (req, res) => {
    try {
      const updated = await repository.retryOutboundNotification(String(req.params.id), true);
      if (!updated) {
        res.status(404).json({ ok: false, message: 'Reservation not found.' });
        return;
      }
      res.json({ ok: true, reservation: updated });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Could not retry notification.',
      });
    }
  });

  app.patch('/api/demo/conversations/:id', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    try {
      const updated = await repository.updateConversationStatus(String(req.params.id), true, {
        status: VALID_CONV_STATUSES.includes(String(body.status) as ConversationStatus)
          ? (String(body.status) as ConversationStatus)
          : undefined,
        needsHumanAssistance:
          typeof body.needsHumanAssistance === 'boolean' ? body.needsHumanAssistance : undefined,
        actor: 'Demo Manager',
      });
      if (!updated) {
        res.status(404).json({ ok: false, message: 'Conversation not found.' });
        return;
      }
      res.json({ ok: true, conversation: updated });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Could not update conversation.',
      });
    }
  });

  app.patch('/api/demo/customers/:id', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    try {
      const updated = await repository.updateCustomerNotes(
        String(req.params.id),
        true,
        String(body.internalNotes ?? '').slice(0, 600),
        typeof body.dietaryRequirements === 'string'
          ? body.dietaryRequirements.slice(0, 300)
          : undefined
      );
      if (!updated) {
        res.status(404).json({ ok: false, message: 'Customer not found.' });
        return;
      }
      res.json({ ok: true, customer: updated });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Could not update customer.',
      });
    }
  });

  app.post('/api/demo/notifications/read', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id : undefined;
    try {
      await repository.markNotificationsRead(true, id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Could not mark notifications read.',
      });
    }
  });

  app.put('/api/demo/settings', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    try {
      const settings = await repository.updateSettings(
        {
          operatingDays: Array.isArray(body.operatingDays)
            ? body.operatingDays.map(String)
            : undefined,
          openingTime:
            body.openingTime === null || typeof body.openingTime === 'string'
              ? body.openingTime
              : undefined,
          closingTime:
            body.closingTime === null || typeof body.closingTime === 'string'
              ? body.closingTime
              : undefined,
          hoursConfigured:
            typeof body.hoursConfigured === 'boolean' ? body.hoursConfigured : undefined,
          timeSlots: Array.isArray(body.timeSlots) ? body.timeSlots.map(String) : undefined,
          reservationDurationMinutes:
            typeof body.reservationDurationMinutes === 'number'
              ? Math.min(360, Math.max(30, body.reservationDurationMinutes))
              : undefined,
          rooftopCapacity:
            body.rooftopCapacity === null || typeof body.rooftopCapacity === 'number'
              ? body.rooftopCapacity
              : undefined,
          indoorCapacity:
            body.indoorCapacity === null || typeof body.indoorCapacity === 'number'
              ? body.indoorCapacity
              : undefined,
          maxGuestCount:
            body.maxGuestCount === null || typeof body.maxGuestCount === 'number'
              ? body.maxGuestCount
              : undefined,
          capacityConfigured:
            typeof body.capacityConfigured === 'boolean' ? body.capacityConfigured : undefined,
          capacityIsSample:
            typeof body.capacityIsSample === 'boolean' ? body.capacityIsSample : undefined,
          closureDates: Array.isArray(body.closureDates)
            ? body.closureDates.map(String).filter(isValidDateStr)
            : undefined,
          requireManagerApproval:
            typeof body.requireManagerApproval === 'boolean'
              ? body.requireManagerApproval
              : undefined,
          n8nOutboundEnabled:
            typeof body.n8nOutboundEnabled === 'boolean' ? body.n8nOutboundEnabled : undefined,
        },
        true
      );
      res.json({ ok: true, settings });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Could not save settings.',
      });
    }
  });

  app.post('/api/demo/integrations/test', async (_req, res) => {
    try {
      const status = await repository.testIntegrations(true);
      res.json({ ok: true, integrationStatus: status });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Integration test failed.',
      });
    }
  });

  app.post('/api/demo/reset', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const reseed = body.reseed !== false;
    simulatedSessions.clear();
    try {
      await repository.resetDemoWorkspace(reseed);
      const snapshot = await repository.getWorkspaceSnapshot(true);
      res.json({ ok: true, snapshot });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Could not reset demo workspace.',
      });
    }
  });

  // 5. PRODUCTION MANAGER AUTHENTICATED ENDPOINTS (/api/admin/*)
  app.get('/api/admin/auth/status', (req, res) => {
    const auth = getAdminAuthStatus();
    const authenticated = verifyManagerBearerToken(req.headers.authorization);
    res.json({ ok: true, ...auth, authenticated });
  });

  app.post('/api/admin/auth/claim', (req, res) => {
    const passcode = String((req.body || {}).passcode ?? '');
    if (!claimFirstRunManagerPasscode(passcode)) {
      res.status(400).json({
        ok: false,
        message:
          'Passcode already configured or too short (minimum 8 characters required).',
      });
      return;
    }
    const token = issueManagerBearerToken();
    res.json({ ok: true, token });
  });

  app.post('/api/admin/auth/login', (req, res) => {
    const passcode = String((req.body || {}).passcode ?? '');
    if (!verifyManagerPasscode(passcode)) {
      res.status(401).json({ ok: false, message: 'Invalid manager passcode.' });
      return;
    }
    const token = issueManagerBearerToken();
    res.json({ ok: true, token });
  });

  app.get('/api/admin/workspace', requireManagerAuth, async (_req, res) => {
    try {
      const snapshot = await repository.getWorkspaceSnapshot(false);
      res.json({ ok: true, snapshot });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Failed to load production workspace.',
      });
    }
  });

  app.patch('/api/admin/reservations/:id', requireManagerAuth, async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    try {
      const updated = await repository.updateReservation(String(req.params.id), false, {
        status: VALID_STATUSES.includes(String(body.status) as ReservationStatus)
          ? (String(body.status) as ReservationStatus)
          : undefined,
        managerNotes: typeof body.managerNotes === 'string' ? body.managerNotes : undefined,
        reservationDate:
          typeof body.reservationDate === 'string' && isValidDateStr(body.reservationDate)
            ? body.reservationDate
            : undefined,
        reservationTime:
          typeof body.reservationTime === 'string' ? body.reservationTime : undefined,
        actor: 'Production Manager',
      });
      if (!updated) {
        res.status(404).json({ ok: false, message: 'Production reservation not found.' });
        return;
      }
      res.json({ ok: true, reservation: updated });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'persistence_error',
        message: err instanceof Error ? err.message : 'Could not update production reservation.',
      });
    }
  });
}
