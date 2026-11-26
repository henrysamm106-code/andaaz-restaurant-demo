import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  ActivityLogRecord,
  ConversationMessageRecord,
  ConversationRecord,
  ConversationSource,
  ConversationStatus,
  CustomerRecord,
  IntegrationConnectionState,
  IntegrationEventRecord,
  IntegrationStatusSummary,
  ManagementSeating,
  NotificationRecord,
  NotificationType,
  ReservationRecord,
  ReservationSource,
  ReservationStatus,
  RestaurantSettingsRecord,
  WorkspaceSnapshot,
} from '../src/types/management.ts';
import { buildSyntheticDemoDataset, createDefaultSettings } from './seedDemoData.ts';

export function getKarachiDateAndTime(): { dateStr: string; timeStr: string } {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
  return { dateStr, timeStr };
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0092')) return digits.slice(2);
  if (digits.startsWith('03') && digits.length === 11) return `92${digits.slice(1)}`;
  return digits;
}

export function generateBookingReference(dateStr: string): string {
  const ym = dateStr.replace(/-/g, '').slice(2, 6); // YYMM
  const rand = crypto.randomInt(1000, 9999);
  return `ANZ-${ym}-${rand}`;
}

export interface CreateReservationInput {
  externalEventId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  guestCity?: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  seatingPreference?: ManagementSeating;
  specialOccasion?: string;
  specialRequests?: string;
  dietaryRequirements?: string;
  source: ReservationSource;
  conversationId?: string | null;
  managerNotes?: string;
  isDemo: boolean;
  actor: string;
}

export interface UpdateReservationInput {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  guestCity?: string;
  reservationDate?: string;
  reservationTime?: string;
  guestCount?: number;
  seatingPreference?: ManagementSeating;
  specialOccasion?: string;
  specialRequests?: string;
  dietaryRequirements?: string;
  status?: ReservationStatus;
  managerNotes?: string;
  actionNote?: string;
  actor: string;
}

export interface UpsertConversationInput {
  externalSessionId: string;
  customerIdentifier: string;
  customerName?: string;
  source: ConversationSource;
  status?: ConversationStatus;
  detectedIntent?: string;
  linkedReservationId?: string | null;
  responseLatencyMs?: number | null;
  needsHumanAssistance?: boolean;
  isDemo: boolean;
  messages?: Array<{
    externalMessageId?: string | null;
    sender: 'customer' | 'assistant' | 'system';
    content: string;
    latencyMs?: number | null;
    createdAt?: string;
  }>;
}

export interface IntegrationEventInput {
  externalEventId?: string | null;
  eventType: string;
  source: string;
  status: 'success' | 'duplicate' | 'failed' | 'not_configured';
  httpStatus?: number | null;
  summary: string;
  errorMessage?: string | null;
  isDemo: boolean;
}

function getEnvConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const n8nChatUrl = (process.env.N8N_CHAT_WEBHOOK_URL || '').trim();
  const n8nStatusUrl = (process.env.N8N_STATUS_WEBHOOK_URL || '').trim();
  const n8nSecret = (process.env.N8N_INTEGRATION_SECRET || '').trim();
  const whatsappTestRaw = (process.env.WHATSAPP_TEST_NUMBER || '').trim().replace(/\D/g, '');
  const whatsappCloudFlag = (process.env.WHATSAPP_CLOUD_API_CONFIGURED || '').trim().toLowerCase() === 'true';

  return {
    supabaseUrl,
    supabaseServiceKey,
    supabaseConfigured: Boolean(supabaseUrl && supabaseServiceKey),
    n8nChatUrl,
    n8nStatusUrl,
    n8nSecret,
    whatsappTestDigits: whatsappTestRaw.length >= 7 ? whatsappTestRaw : '',
    whatsappCloudFlag,
  };
}

class MemoryAndSupabaseStore {
  private supabase: SupabaseClient | null = null;
  private customers: CustomerRecord[] = [];
  private reservations: ReservationRecord[] = [];
  private conversations: ConversationRecord[] = [];
  private notifications: NotificationRecord[] = [];
  private activityLogs: ActivityLogRecord[] = [];
  private integrationEvents: IntegrationEventRecord[] = [];
  private settings: RestaurantSettingsRecord = createDefaultSettings();
  private lastVerifiedDbState: IntegrationConnectionState | null = null;
  private lastVerifiedN8nChatState: IntegrationConnectionState | null = null;
  private lastVerifiedN8nStatusState: IntegrationConnectionState | null = null;

  constructor() {
    const env = getEnvConfig();
    if (env.supabaseConfigured) {
      this.supabase = createClient(env.supabaseUrl, env.supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    const { dateStr } = getKarachiDateAndTime();
    this.seedDemoInMemory(dateStr);
  }

  getStorageMode(): 'supabase' | 'demo_memory' {
    return this.supabase ? 'supabase' : 'demo_memory';
  }

  private seedDemoInMemory(karachiToday: string) {
    const dataset = buildSyntheticDemoDataset(karachiToday);
    // Keep non-demo records intact if any exist in memory, replace demo records cleanly
    this.customers = [...this.customers.filter((c) => !c.isDemo), ...dataset.customers];
    this.reservations = [...this.reservations.filter((r) => !r.isDemo), ...dataset.reservations];
    this.conversations = [...this.conversations.filter((c) => !c.isDemo), ...dataset.conversations];
    this.notifications = [...this.notifications.filter((n) => !n.isDemo), ...dataset.notifications];
    this.activityLogs = [...this.activityLogs.filter((a) => !a.isDemo), ...dataset.activityLogs];
    this.integrationEvents = [
      ...this.integrationEvents.filter((e) => !e.isDemo),
      ...dataset.integrationEvents,
    ];
  }

  async resetDemoWorkspace(reseedSample = true): Promise<void> {
    const { dateStr } = getKarachiDateAndTime();
    if (this.supabase) {
      await this.supabase.from('notifications').delete().eq('is_demo', true);
      await this.supabase.from('activity_logs').delete().eq('is_demo', true);
      await this.supabase.from('integration_events').delete().eq('is_demo', true);
      await this.supabase.from('conversations').delete().eq('is_demo', true);
      await this.supabase.from('reservations').delete().eq('is_demo', true);
      await this.supabase.from('customers').delete().eq('is_demo', true);

      if (reseedSample) {
        const dataset = buildSyntheticDemoDataset(dateStr);
        await this.insertSeedToSupabase(dataset);
      }
      return;
    }

    this.customers = this.customers.filter((c) => !c.isDemo);
    this.reservations = this.reservations.filter((r) => !r.isDemo);
    this.conversations = this.conversations.filter((c) => !c.isDemo);
    this.notifications = this.notifications.filter((n) => !n.isDemo);
    this.activityLogs = this.activityLogs.filter((a) => !a.isDemo);
    this.integrationEvents = this.integrationEvents.filter((e) => !e.isDemo);

    if (reseedSample) {
      this.seedDemoInMemory(dateStr);
    }
  }

  private async insertSeedToSupabase(dataset: ReturnType<typeof buildSyntheticDemoDataset>) {
    if (!this.supabase) return;
    if (dataset.customers.length > 0) {
      await this.supabase.from('customers').insert(
        dataset.customers.map((c) => ({
          id: c.id,
          full_name: c.fullName,
          phone_normalized: c.phoneNormalized,
          phone_display: c.phoneDisplay,
          email: c.email || null,
          preferred_seating: c.preferredSeating,
          dietary_requirements: c.dietaryRequirements || null,
          previous_occasions: c.previousOccasions,
          internal_notes: c.internalNotes,
          is_demo: true,
          created_at: c.createdAt,
          updated_at: c.updatedAt,
        }))
      );
    }
    if (dataset.reservations.length > 0) {
      await this.supabase.from('reservations').insert(
        dataset.reservations.map((r) => ({
          id: r.id,
          booking_reference: r.bookingReference,
          customer_id: r.customerId,
          external_event_id: r.externalEventId,
          customer_name: r.customerName,
          customer_phone: r.customerPhone,
          customer_email: r.customerEmail || null,
          guest_city: r.guestCity || null,
          reservation_date: r.reservationDate,
          reservation_time: r.reservationTime,
          guest_count: r.guestCount,
          seating_preference: r.seatingPreference,
          special_occasion: r.specialOccasion || null,
          special_requests: r.specialRequests || null,
          dietary_requirements: r.dietaryRequirements || null,
          source: r.source,
          status: r.status,
          conversation_id: r.conversationId,
          manager_notes: r.managerNotes,
          status_history: r.statusHistory,
          last_outbound_notification_status: r.lastOutboundNotificationStatus,
          last_outbound_event_id: r.lastOutboundEventId,
          is_demo: true,
          created_at: r.createdAt,
          updated_at: r.updatedAt,
        }))
      );
    }
    if (dataset.conversations.length > 0) {
      await this.supabase.from('conversations').insert(
        dataset.conversations.map((cv) => ({
          id: cv.id,
          external_session_id: cv.externalSessionId,
          customer_id: cv.customerId,
          customer_identifier: cv.customerIdentifier,
          source: cv.source,
          status: cv.status,
          detected_intent: cv.detectedIntent,
          linked_reservation_id: cv.linkedReservationId,
          response_latency_ms: cv.responseLatencyMs,
          needs_human_assistance: cv.needsHumanAssistance,
          last_message_at: cv.lastMessageAt,
          is_demo: true,
          created_at: cv.createdAt,
          updated_at: cv.updatedAt,
        }))
      );
      const allMessages = dataset.conversations.flatMap((cv) =>
        cv.messages.map((m) => ({
          id: m.id,
          conversation_id: cv.id,
          external_message_id: m.externalMessageId,
          sender: m.sender,
          content: m.content,
          latency_ms: m.latencyMs,
          created_at: m.createdAt,
        }))
      );
      if (allMessages.length > 0) {
        await this.supabase.from('conversation_messages').insert(allMessages);
      }
    }
    if (dataset.notifications.length > 0) {
      await this.supabase.from('notifications').insert(
        dataset.notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          is_read: n.isRead,
          reservation_id: n.reservationId,
          conversation_id: n.conversationId,
          is_demo: true,
          created_at: n.createdAt,
        }))
      );
    }
    if (dataset.activityLogs.length > 0) {
      await this.supabase.from('activity_logs').insert(
        dataset.activityLogs.map((a) => ({
          id: a.id,
          entity_type: a.entityType,
          entity_id: a.entityId,
          action: a.action,
          actor: a.actor,
          details: a.details,
          is_demo: true,
          created_at: a.createdAt,
        }))
      );
    }
    if (dataset.integrationEvents.length > 0) {
      await this.supabase.from('integration_events').insert(
        dataset.integrationEvents.map((e) => ({
          id: e.id,
          external_event_id: e.externalEventId,
          event_type: e.eventType,
          source: e.source,
          status: e.status,
          http_status: e.httpStatus,
          summary: e.summary,
          error_message: e.errorMessage,
          is_demo: true,
          created_at: e.createdAt,
        }))
      );
    }
  }

  private mapSupabaseReservation(row: Record<string, unknown>): ReservationRecord {
    return {
      id: String(row.id),
      bookingReference: String(row.booking_reference),
      customerId: String(row.customer_id),
      externalEventId: row.external_event_id ? String(row.external_event_id) : null,
      customerName: String(row.customer_name),
      customerPhone: String(row.customer_phone),
      customerEmail: row.customer_email ? String(row.customer_email) : '',
      guestCity: row.guest_city ? String(row.guest_city) : '',
      reservationDate: String(row.reservation_date),
      reservationTime: String(row.reservation_time),
      guestCount: Number(row.guest_count),
      seatingPreference: (row.seating_preference as ManagementSeating) || 'no-preference',
      specialOccasion: row.special_occasion ? String(row.special_occasion) : '',
      specialRequests: row.special_requests ? String(row.special_requests) : '',
      dietaryRequirements: row.dietary_requirements ? String(row.dietary_requirements) : '',
      source: row.source as ReservationSource,
      status: row.status as ReservationStatus,
      conversationId: row.conversation_id ? String(row.conversation_id) : null,
      managerNotes: row.manager_notes ? String(row.manager_notes) : '',
      statusHistory: Array.isArray(row.status_history)
        ? (row.status_history as ReservationRecord['statusHistory'])
        : [],
      lastOutboundNotificationStatus:
        (row.last_outbound_notification_status as ReservationRecord['lastOutboundNotificationStatus']) ||
        'not_configured',
      lastOutboundEventId: row.last_outbound_event_id ? String(row.last_outbound_event_id) : null,
      isDemo: Boolean(row.is_demo),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  private mapSupabaseCustomer(row: Record<string, unknown>): CustomerRecord {
    return {
      id: String(row.id),
      fullName: String(row.full_name),
      phoneNormalized: String(row.phone_normalized),
      phoneDisplay: String(row.phone_display),
      email: row.email ? String(row.email) : '',
      preferredSeating: (row.preferred_seating as ManagementSeating) || 'no-preference',
      dietaryRequirements: row.dietary_requirements ? String(row.dietary_requirements) : '',
      previousOccasions: Array.isArray(row.previous_occasions)
        ? row.previous_occasions.map(String)
        : [],
      internalNotes: row.internal_notes ? String(row.internal_notes) : '',
      isDemo: Boolean(row.is_demo),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  async getSettings(): Promise<RestaurantSettingsRecord> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('restaurant_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();
      if (!error && data) {
        return {
          id: String(data.id),
          operatingDays: Array.isArray(data.operating_days) ? data.operating_days.map(String) : [],
          openingTime: data.opening_time ? String(data.opening_time) : null,
          closingTime: data.closing_time ? String(data.closing_time) : null,
          hoursConfigured: Boolean(data.hours_configured),
          timeSlots: Array.isArray(data.time_slots) ? data.time_slots.map(String) : [],
          reservationDurationMinutes: Number(data.reservation_duration_minutes || 120),
          rooftopCapacity: data.rooftop_capacity ? Number(data.rooftop_capacity) : null,
          indoorCapacity: data.indoor_capacity ? Number(data.indoor_capacity) : null,
          maxGuestCount: data.max_guest_count ? Number(data.max_guest_count) : null,
          capacityConfigured: Boolean(data.capacity_configured),
          capacityIsSample: Boolean(data.capacity_is_sample),
          closureDates: Array.isArray(data.closure_dates) ? data.closure_dates.map(String) : [],
          requireManagerApproval: Boolean(data.require_manager_approval),
          n8nOutboundEnabled: Boolean(data.n8n_outbound_enabled),
          updatedAt: String(data.updated_at),
        };
      }
    }
    return this.settings;
  }

  async updateSettings(
    patch: Partial<RestaurantSettingsRecord>,
    isDemoWorkspace: boolean
  ): Promise<RestaurantSettingsRecord> {
    const current = await this.getSettings();
    const next: RestaurantSettingsRecord = {
      ...current,
      ...patch,
      id: 'default',
      updatedAt: new Date().toISOString(),
    };

    if (this.supabase) {
      await this.supabase.from('restaurant_settings').upsert({
        id: 'default',
        operating_days: next.operatingDays,
        opening_time: next.openingTime,
        closing_time: next.closingTime,
        hours_configured: next.hoursConfigured,
        time_slots: next.timeSlots,
        reservation_duration_minutes: next.reservationDurationMinutes,
        rooftop_capacity: next.rooftopCapacity,
        indoor_capacity: next.indoorCapacity,
        max_guest_count: next.maxGuestCount,
        capacity_configured: next.capacityConfigured,
        capacity_is_sample: next.capacityIsSample,
        closure_dates: next.closureDates,
        require_manager_approval: next.requireManagerApproval,
        n8n_outbound_enabled: next.n8nOutboundEnabled,
        updated_at: next.updatedAt,
      });
    } else {
      this.settings = next;
    }

    await this.recordActivity({
      entityType: 'settings',
      entityId: 'default',
      action: 'settings_updated',
      actor: isDemoWorkspace ? 'Demo Manager' : 'Manager',
      details: {
        hoursConfigured: next.hoursConfigured,
        capacityConfigured: next.capacityConfigured,
        capacityIsSample: next.capacityIsSample,
      },
      isDemo: isDemoWorkspace,
    });

    return next;
  }

  async getIntegrationStatus(isDemoWorkspace: boolean): Promise<IntegrationStatusSummary> {
    const env = getEnvConfig();
    const events = await this.listIntegrationEvents(isDemoWorkspace);
    const lastSuccess = events.find((e) => e.status === 'success') ?? null;
    const lastFailed = events.find((e) => e.status === 'failed') ?? null;

    const databaseState: IntegrationConnectionState = env.supabaseConfigured
      ? this.lastVerifiedDbState || 'configured_unverified'
      : isDemoWorkspace
        ? 'demo_mode'
        : 'not_configured';

    const n8nInboundState: IntegrationConnectionState = env.n8nSecret
      ? 'configured_unverified'
      : isDemoWorkspace
        ? 'demo_mode'
        : 'not_configured';

    const n8nChatProxyState: IntegrationConnectionState = env.n8nChatUrl
      ? this.lastVerifiedN8nChatState || 'configured_unverified'
      : 'not_configured';

    const n8nStatusWebhookState: IntegrationConnectionState = env.n8nStatusUrl
      ? this.lastVerifiedN8nStatusState || 'configured_unverified'
      : 'not_configured';

    const whatsappCloudState: IntegrationConnectionState = env.whatsappCloudFlag
      ? env.n8nChatUrl
        ? 'configured_unverified'
        : 'error'
      : 'not_configured';

    const managerNotificationsState: IntegrationConnectionState = env.n8nStatusUrl
      ? this.lastVerifiedN8nStatusState || 'configured_unverified'
      : isDemoWorkspace
        ? 'demo_mode'
        : 'not_configured';

    return {
      storageMode: this.getStorageMode(),
      databaseState,
      n8nInboundState,
      n8nChatProxyState,
      n8nStatusWebhookState,
      whatsappCloudState,
      whatsappTestNumberConfigured: Boolean(env.whatsappTestDigits),
      whatsappTestNumberDisplay: env.whatsappTestDigits ? `+${env.whatsappTestDigits}` : null,
      managerNotificationsState,
      lastSuccessfulEvent: lastSuccess,
      lastFailedEvent: lastFailed,
      checkedAt: new Date().toISOString(),
    };
  }

  async testIntegrations(isDemoWorkspace: boolean): Promise<IntegrationStatusSummary> {
    const env = getEnvConfig();

    if (this.supabase) {
      try {
        const { error } = await this.supabase.from('restaurant_settings').select('id').limit(1);
        this.lastVerifiedDbState = error ? 'error' : 'connected';
        await this.recordIntegrationEvent({
          eventType: 'health_check.supabase',
          source: 'dashboard',
          status: error ? 'failed' : 'success',
          httpStatus: error ? 500 : 200,
          summary: error
            ? 'Supabase connection test failed.'
            : 'Supabase database connection verified.',
          errorMessage: error ? error.message : null,
          isDemo: isDemoWorkspace,
        });
      } catch (err) {
        this.lastVerifiedDbState = 'error';
        await this.recordIntegrationEvent({
          eventType: 'health_check.supabase',
          source: 'dashboard',
          status: 'failed',
          httpStatus: 500,
          summary: 'Supabase connection threw an exception.',
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          isDemo: isDemoWorkspace,
        });
      }
    }

    if (env.n8nChatUrl) {
      try {
        const parsed = new URL(env.n8nChatUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error('Unsupported URL protocol');
        }
        const resp = await fetch(parsed.toString(), {
          method: 'HEAD',
          signal: AbortSignal.timeout(4000),
        });
        // n8n webhook URLs often respond 404/405 to HEAD while reachable; < 500 means endpoint responded
        const reachable = resp.status < 500;
        this.lastVerifiedN8nChatState = reachable ? 'connected' : 'error';
        await this.recordIntegrationEvent({
          eventType: 'health_check.n8n_chat',
          source: 'dashboard',
          status: reachable ? 'success' : 'failed',
          httpStatus: resp.status,
          summary: reachable
            ? `n8n Chat webhook host responded (HTTP ${resp.status}).`
            : `n8n Chat webhook returned server error (HTTP ${resp.status}).`,
          errorMessage: reachable ? null : `HTTP ${resp.status}`,
          isDemo: isDemoWorkspace,
        });
      } catch (err) {
        this.lastVerifiedN8nChatState = 'error';
        await this.recordIntegrationEvent({
          eventType: 'health_check.n8n_chat',
          source: 'dashboard',
          status: 'failed',
          httpStatus: 502,
          summary: 'Failed to reach configured N8N_CHAT_WEBHOOK_URL.',
          errorMessage: err instanceof Error ? err.message : 'Connection failed',
          isDemo: isDemoWorkspace,
        });
      }
    }

    if (env.n8nStatusUrl) {
      try {
        const parsed = new URL(env.n8nStatusUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error('Unsupported URL protocol');
        }
        const resp = await fetch(parsed.toString(), {
          method: 'HEAD',
          signal: AbortSignal.timeout(4000),
        });
        const reachable = resp.status < 500;
        this.lastVerifiedN8nStatusState = reachable ? 'connected' : 'error';
        await this.recordIntegrationEvent({
          eventType: 'health_check.n8n_status',
          source: 'dashboard',
          status: reachable ? 'success' : 'failed',
          httpStatus: resp.status,
          summary: reachable
            ? `n8n Status webhook host responded (HTTP ${resp.status}).`
            : `n8n Status webhook returned HTTP ${resp.status}.`,
          errorMessage: reachable ? null : `HTTP ${resp.status}`,
          isDemo: isDemoWorkspace,
        });
      } catch (err) {
        this.lastVerifiedN8nStatusState = 'error';
        await this.recordIntegrationEvent({
          eventType: 'health_check.n8n_status',
          source: 'dashboard',
          status: 'failed',
          httpStatus: 502,
          summary: 'Failed to reach configured N8N_STATUS_WEBHOOK_URL.',
          errorMessage: err instanceof Error ? err.message : 'Connection failed',
          isDemo: isDemoWorkspace,
        });
      }
    }

    return this.getIntegrationStatus(isDemoWorkspace);
  }

  private async upsertCustomer(params: {
    fullName: string;
    phoneDisplay: string;
    email?: string;
    seating?: ManagementSeating;
    dietary?: string;
    occasion?: string;
    isDemo: boolean;
  }): Promise<CustomerRecord> {
    const normalized = normalizePhone(params.phoneDisplay);
    const now = new Date().toISOString();

    if (this.supabase) {
      const { data: existing } = await this.supabase
        .from('customers')
        .select('*')
        .eq('phone_normalized', normalized)
        .eq('is_demo', params.isDemo)
        .maybeSingle();

      if (existing) {
        const existingMapped = this.mapSupabaseCustomer(existing);
        const occasions = new Set(existingMapped.previousOccasions);
        if (params.occasion?.trim()) occasions.add(params.occasion.trim());
        const updatedPatch = {
          full_name: params.fullName.trim() || existingMapped.fullName,
          phone_display: params.phoneDisplay.trim() || existingMapped.phoneDisplay,
          email: params.email?.trim() || existingMapped.email || null,
          preferred_seating:
            params.seating && params.seating !== 'no-preference'
              ? params.seating
              : existingMapped.preferredSeating,
          dietary_requirements:
            params.dietary?.trim() || existingMapped.dietaryRequirements || null,
          previous_occasions: Array.from(occasions),
        };
        const { data: updated } = await this.supabase
          .from('customers')
          .update(updatedPatch)
          .eq('id', existingMapped.id)
          .select('*')
          .single();
        return this.mapSupabaseCustomer(updated || existing);
      }

      const id = crypto.randomUUID();
      const { data: created, error } = await this.supabase
        .from('customers')
        .insert({
          id,
          full_name: params.fullName.trim(),
          phone_normalized: normalized || id,
          phone_display: params.phoneDisplay.trim(),
          email: params.email?.trim() || null,
          preferred_seating: params.seating || 'no-preference',
          dietary_requirements: params.dietary?.trim() || null,
          previous_occasions: params.occasion?.trim() ? [params.occasion.trim()] : [],
          internal_notes: '',
          is_demo: params.isDemo,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return this.mapSupabaseCustomer(created);
    }

    const existing = this.customers.find(
      (c) => c.isDemo === params.isDemo && c.phoneNormalized === normalized && normalized !== ''
    );
    if (existing) {
      existing.fullName = params.fullName.trim() || existing.fullName;
      existing.phoneDisplay = params.phoneDisplay.trim() || existing.phoneDisplay;
      if (params.email?.trim()) existing.email = params.email.trim();
      if (params.seating && params.seating !== 'no-preference') {
        existing.preferredSeating = params.seating;
      }
      if (params.dietary?.trim()) existing.dietaryRequirements = params.dietary.trim();
      if (params.occasion?.trim() && !existing.previousOccasions.includes(params.occasion.trim())) {
        existing.previousOccasions = [...existing.previousOccasions, params.occasion.trim()];
      }
      existing.updatedAt = now;
      return existing;
    }

    const created: CustomerRecord = {
      id: crypto.randomUUID(),
      fullName: params.fullName.trim(),
      phoneNormalized: normalized || crypto.randomUUID(),
      phoneDisplay: params.phoneDisplay.trim(),
      email: params.email?.trim() || '',
      preferredSeating: params.seating || 'no-preference',
      dietaryRequirements: params.dietary?.trim() || '',
      previousOccasions: params.occasion?.trim() ? [params.occasion.trim()] : [],
      internalNotes: '',
      isDemo: params.isDemo,
      createdAt: now,
      updatedAt: now,
    };
    this.customers.unshift(created);
    return created;
  }

  async createReservation(
    input: CreateReservationInput
  ): Promise<{ reservation: ReservationRecord; duplicate: boolean }> {
    const extId = input.externalEventId?.trim() || null;

    if (extId) {
      const existing = await this.findReservationByExternalEventId(extId);
      if (existing) {
        return { reservation: existing, duplicate: true };
      }
    }

    const customer = await this.upsertCustomer({
      fullName: input.customerName,
      phoneDisplay: input.customerPhone,
      email: input.customerEmail,
      seating: input.seatingPreference,
      dietary: input.dietaryRequirements,
      occasion: input.specialOccasion,
      isDemo: input.isDemo,
    });

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const bookingReference = generateBookingReference(input.reservationDate);
    const initialHistory = [
      {
        status: 'pending' as ReservationStatus,
        changedAt: now,
        actor: input.actor,
        note: `Created via ${input.source} (Pending manager confirmation).`,
      },
    ];

    const record: ReservationRecord = {
      id,
      bookingReference,
      customerId: customer.id,
      externalEventId: extId,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      customerEmail: input.customerEmail?.trim() || '',
      guestCity: input.guestCity?.trim() || '',
      reservationDate: input.reservationDate,
      reservationTime: input.reservationTime.trim(),
      guestCount: input.guestCount,
      seatingPreference: input.seatingPreference || 'no-preference',
      specialOccasion: input.specialOccasion?.trim() || '',
      specialRequests: input.specialRequests?.trim() || '',
      dietaryRequirements: input.dietaryRequirements?.trim() || '',
      source: input.source,
      status: 'pending',
      conversationId: input.conversationId || null,
      managerNotes: input.managerNotes?.trim() || '',
      statusHistory: initialHistory,
      lastOutboundNotificationStatus: input.isDemo ? 'skipped_demo' : 'not_configured',
      lastOutboundEventId: null,
      isDemo: input.isDemo,
      createdAt: now,
      updatedAt: now,
    };

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('reservations')
        .insert({
          id: record.id,
          booking_reference: record.bookingReference,
          customer_id: record.customerId,
          external_event_id: record.externalEventId,
          customer_name: record.customerName,
          customer_phone: record.customerPhone,
          customer_email: record.customerEmail || null,
          guest_city: record.guestCity || null,
          reservation_date: record.reservationDate,
          reservation_time: record.reservationTime,
          guest_count: record.guestCount,
          seating_preference: record.seatingPreference,
          special_occasion: record.specialOccasion || null,
          special_requests: record.specialRequests || null,
          dietary_requirements: record.dietaryRequirements || null,
          source: record.source,
          status: 'pending',
          conversation_id: record.conversationId,
          manager_notes: record.managerNotes,
          status_history: record.statusHistory,
          last_outbound_notification_status: record.lastOutboundNotificationStatus,
          is_demo: record.isDemo,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      Object.assign(record, this.mapSupabaseReservation(data));
    } else {
      this.reservations.unshift(record);
    }

    // Link conversation if externalSessionId or internal conversation id was supplied
    if (input.conversationId) {
      await this.linkConversationToReservation(input.conversationId, record.id, input.isDemo);
    }

    // Create source-specific in-app notification
    const notifType: NotificationType =
      record.source === 'whatsapp_ai'
        ? 'new_whatsapp_ai_reservation'
        : record.source === 'web_ai_demo'
          ? 'new_web_ai_demo_reservation'
          : record.specialOccasion
            ? 'special_occasion_booking'
            : 'new_website_reservation';

    await this.createNotification({
      type: notifType,
      title: `New Pending Request · ${record.bookingReference}`,
      message: `${record.customerName} requested ${record.guestCount} guests on ${record.reservationDate} (${record.reservationTime}) via ${record.source.replace('_', ' ')}.`,
      reservationId: record.id,
      conversationId: record.conversationId,
      isDemo: record.isDemo,
    });

    await this.recordActivity({
      entityType: 'reservation',
      entityId: record.id,
      action: 'created_pending',
      actor: input.actor,
      details: {
        bookingReference: record.bookingReference,
        source: record.source,
        guestCount: record.guestCount,
      },
      isDemo: record.isDemo,
    });

    return { reservation: record, duplicate: false };
  }

  private async findReservationByExternalEventId(extId: string): Promise<ReservationRecord | null> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('reservations')
        .select('*')
        .eq('external_event_id', extId)
        .maybeSingle();
      return data ? this.mapSupabaseReservation(data) : null;
    }
    return this.reservations.find((r) => r.externalEventId === extId) ?? null;
  }

  async getReservationById(id: string, isDemo: boolean): Promise<ReservationRecord | null> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .eq('is_demo', isDemo)
        .maybeSingle();
      return data ? this.mapSupabaseReservation(data) : null;
    }
    return this.reservations.find((r) => r.id === id && r.isDemo === isDemo) ?? null;
  }

  async updateReservation(
    id: string,
    isDemo: boolean,
    patch: UpdateReservationInput
  ): Promise<ReservationRecord | null> {
    const existing = await this.getReservationById(id, isDemo);
    if (!existing) return null;

    const now = new Date().toISOString();
    const nextStatus = patch.status ?? existing.status;
    const statusChanged = nextStatus !== existing.status;
    const dateOrTimeChanged =
      (patch.reservationDate && patch.reservationDate !== existing.reservationDate) ||
      (patch.reservationTime && patch.reservationTime !== existing.reservationTime);

    const history = [...existing.statusHistory];
    if (statusChanged || dateOrTimeChanged) {
      history.push({
        status: nextStatus,
        changedAt: now,
        actor: patch.actor,
        note:
          patch.actionNote ||
          (dateOrTimeChanged
            ? `Rescheduled to ${patch.reservationDate || existing.reservationDate} at ${patch.reservationTime || existing.reservationTime}`
            : `Status updated to ${nextStatus}`),
      });
    }

    const updated: ReservationRecord = {
      ...existing,
      customerName: patch.customerName !== undefined ? patch.customerName.trim() : existing.customerName,
      customerPhone:
        patch.customerPhone !== undefined ? patch.customerPhone.trim() : existing.customerPhone,
      customerEmail:
        patch.customerEmail !== undefined ? patch.customerEmail.trim() : existing.customerEmail,
      guestCity: patch.guestCity !== undefined ? patch.guestCity.trim() : existing.guestCity,
      reservationDate: patch.reservationDate ?? existing.reservationDate,
      reservationTime: patch.reservationTime ?? existing.reservationTime,
      guestCount: patch.guestCount ?? existing.guestCount,
      seatingPreference: patch.seatingPreference ?? existing.seatingPreference,
      specialOccasion:
        patch.specialOccasion !== undefined ? patch.specialOccasion.trim() : existing.specialOccasion,
      specialRequests:
        patch.specialRequests !== undefined ? patch.specialRequests.trim() : existing.specialRequests,
      dietaryRequirements:
        patch.dietaryRequirements !== undefined
          ? patch.dietaryRequirements.trim()
          : existing.dietaryRequirements,
      status: nextStatus,
      managerNotes:
        patch.managerNotes !== undefined ? patch.managerNotes.trim() : existing.managerNotes,
      statusHistory: history,
      updatedAt: now,
    };

    // Persist manager decision FIRST (never rolled back if outbound webhook fails)
    if (this.supabase) {
      const { error } = await this.supabase
        .from('reservations')
        .update({
          customer_name: updated.customerName,
          customer_phone: updated.customerPhone,
          customer_email: updated.customerEmail || null,
          guest_city: updated.guestCity || null,
          reservation_date: updated.reservationDate,
          reservation_time: updated.reservationTime,
          guest_count: updated.guestCount,
          seating_preference: updated.seatingPreference,
          special_occasion: updated.specialOccasion || null,
          special_requests: updated.specialRequests || null,
          dietary_requirements: updated.dietaryRequirements || null,
          status: updated.status,
          manager_notes: updated.managerNotes,
          status_history: updated.statusHistory,
        })
        .eq('id', updated.id)
        .eq('is_demo', isDemo);
      if (error) throw new Error(error.message);
    } else {
      const idx = this.reservations.findIndex((r) => r.id === updated.id);
      if (idx >= 0) this.reservations[idx] = updated;
    }

    await this.recordActivity({
      entityType: 'reservation',
      entityId: updated.id,
      action: statusChanged ? `status_${updated.status}` : 'updated',
      actor: patch.actor,
      details: {
        bookingReference: updated.bookingReference,
        status: updated.status,
        rescheduled: dateOrTimeChanged,
      },
      isDemo,
    });

    if (
      (statusChanged && ['confirmed', 'rejected', 'cancelled'].includes(updated.status)) ||
      dateOrTimeChanged
    ) {
      await this.dispatchOutboundStatusWebhook(updated, dateOrTimeChanged ? 'rescheduled' : updated.status);
    }

    return (await this.getReservationById(id, isDemo)) ?? updated;
  }

  async retryOutboundNotification(id: string, isDemo: boolean): Promise<ReservationRecord | null> {
    const existing = await this.getReservationById(id, isDemo);
    if (!existing) return null;
    await this.dispatchOutboundStatusWebhook(existing, existing.status, true);
    return this.getReservationById(id, isDemo);
  }

  private async dispatchOutboundStatusWebhook(
    reservation: ReservationRecord,
    eventAction: string,
    allowDemoDispatch = false
  ) {
    const env = getEnvConfig();
    const settings = await this.getSettings();
    const outboundEventId = `status-evt-${crypto.randomUUID()}`;

    let statusResult: ReservationRecord['lastOutboundNotificationStatus'] = 'not_configured';

    if (reservation.isDemo && !allowDemoDispatch) {
      statusResult = env.n8nStatusUrl && settings.n8nOutboundEnabled ? 'skipped_demo' : 'not_configured';
      await this.updateOutboundStatusField(reservation.id, statusResult, outboundEventId);
      return;
    }

    if (!env.n8nStatusUrl || !settings.n8nOutboundEnabled) {
      statusResult = 'not_configured';
      await this.updateOutboundStatusField(reservation.id, statusResult, outboundEventId);
      await this.recordIntegrationEvent({
        externalEventId: outboundEventId,
        eventType: `reservation.${eventAction}.outbound_skipped`,
        source: 'dashboard',
        status: 'not_configured',
        httpStatus: null,
        summary: `Outbound n8n notification skipped for ${reservation.bookingReference} (N8N_STATUS_WEBHOOK_URL not configured).`,
        errorMessage: null,
        isDemo: reservation.isDemo,
      });
      return;
    }

    try {
      const parsed = new URL(env.n8nStatusUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid webhook protocol');
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (env.n8nSecret) {
        headers.Authorization = `Bearer ${env.n8nSecret}`;
      }
      const resp = await fetch(parsed.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event_id: outboundEventId,
          event_type: `reservation.${eventAction}`,
          booking_reference: reservation.bookingReference,
          reservation_id: reservation.id,
          status: reservation.status,
          customer_name: reservation.customerName,
          customer_phone: reservation.customerPhone,
          reservation_date: reservation.reservationDate,
          reservation_time: reservation.reservationTime,
          guest_count: reservation.guestCount,
          seating_preference: reservation.seatingPreference,
          conversation_id: reservation.conversationId,
          is_demo: reservation.isDemo,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (!resp.ok) {
        throw new Error(`n8n returned HTTP ${resp.status}`);
      }

      statusResult = 'sent';
      this.lastVerifiedN8nStatusState = 'connected';
      await this.updateOutboundStatusField(reservation.id, statusResult, outboundEventId);
      await this.recordIntegrationEvent({
        externalEventId: outboundEventId,
        eventType: `reservation.${eventAction}.outbound_sent`,
        source: 'dashboard',
        status: 'success',
        httpStatus: resp.status,
        summary: `Triggered n8n status webhook for ${reservation.bookingReference} (${eventAction}).`,
        errorMessage: null,
        isDemo: reservation.isDemo,
      });
    } catch (err) {
      statusResult = 'failed';
      this.lastVerifiedN8nStatusState = 'error';
      const msg = err instanceof Error ? err.message : 'Outbound request failed';
      await this.updateOutboundStatusField(reservation.id, statusResult, outboundEventId);
      await this.recordIntegrationEvent({
        externalEventId: outboundEventId,
        eventType: `reservation.${eventAction}.outbound_failed`,
        source: 'dashboard',
        status: 'failed',
        httpStatus: 502,
        summary: `Failed outbound notification for ${reservation.bookingReference}; manager decision kept.`,
        errorMessage: msg,
        isDemo: reservation.isDemo,
      });
      await this.createNotification({
        type: 'automation_integration_error',
        title: `Outbound Webhook Failed · ${reservation.bookingReference}`,
        message: `Reservation status saved (${reservation.status}), but n8n notification failed: ${msg}`,
        reservationId: reservation.id,
        conversationId: reservation.conversationId,
        isDemo: reservation.isDemo,
      });
    }
  }

  private async updateOutboundStatusField(
    id: string,
    status: ReservationRecord['lastOutboundNotificationStatus'],
    eventId: string
  ) {
    if (this.supabase) {
      await this.supabase
        .from('reservations')
        .update({
          last_outbound_notification_status: status,
          last_outbound_event_id: eventId,
        })
        .eq('id', id);
    } else {
      const rec = this.reservations.find((r) => r.id === id);
      if (rec) {
        rec.lastOutboundNotificationStatus = status;
        rec.lastOutboundEventId = eventId;
      }
    }
  }

  private async linkConversationToReservation(
    convIdentifier: string,
    reservationId: string,
    isDemo: boolean
  ) {
    if (this.supabase) {
      await this.supabase
        .from('conversations')
        .update({ linked_reservation_id: reservationId, status: 'awaiting_manager' })
        .or(`id.eq.${convIdentifier},external_session_id.eq.${convIdentifier}`)
        .eq('is_demo', isDemo);
    } else {
      const conv = this.conversations.find(
        (c) => c.isDemo === isDemo && (c.id === convIdentifier || c.externalSessionId === convIdentifier)
      );
      if (conv) {
        conv.linkedReservationId = reservationId;
        const res = this.reservations.find((r) => r.id === reservationId);
        conv.linkedBookingReference = res?.bookingReference || null;
        conv.status = 'awaiting_manager';
      }
    }
  }

  async upsertConversation(input: UpsertConversationInput): Promise<ConversationRecord> {
    const now = new Date().toISOString();

    if (this.supabase) {
      const { data: existing } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('external_session_id', input.externalSessionId)
        .maybeSingle();

      let convId = existing ? String(existing.id) : crypto.randomUUID();

      if (!existing) {
        const customer =
          input.customerIdentifier && input.customerName
            ? await this.upsertCustomer({
                fullName: input.customerName,
                phoneDisplay: input.customerIdentifier,
                isDemo: input.isDemo,
              })
            : null;
        await this.supabase.from('conversations').insert({
          id: convId,
          external_session_id: input.externalSessionId,
          customer_id: customer?.id || null,
          customer_identifier: input.customerIdentifier,
          source: input.source,
          status: input.status || 'active',
          detected_intent: input.detectedIntent || 'general_inquiry',
          linked_reservation_id: input.linkedReservationId || null,
          response_latency_ms: input.responseLatencyMs ?? null,
          needs_human_assistance: Boolean(input.needsHumanAssistance),
          last_message_at: now,
          is_demo: input.isDemo,
        });
      } else {
        await this.supabase
          .from('conversations')
          .update({
            status: input.status || existing.status,
            detected_intent: input.detectedIntent || existing.detected_intent,
            linked_reservation_id: input.linkedReservationId || existing.linked_reservation_id,
            response_latency_ms: input.responseLatencyMs ?? existing.response_latency_ms,
            needs_human_assistance:
              input.needsHumanAssistance !== undefined
                ? input.needsHumanAssistance
                : existing.needs_human_assistance,
            last_message_at: now,
          })
          .eq('id', convId);
      }

      if (input.messages && input.messages.length > 0) {
        for (const msg of input.messages) {
          await this.supabase.from('conversation_messages').upsert(
            {
              id: crypto.randomUUID(),
              conversation_id: convId,
              external_message_id: msg.externalMessageId || null,
              sender: msg.sender,
              content: msg.content,
              latency_ms: msg.latencyMs ?? null,
              created_at: msg.createdAt || now,
            },
            { onConflict: 'external_message_id', ignoreDuplicates: true }
          );
        }
      }

      const list = await this.listConversations(input.isDemo);
      const found = list.find((c) => c.id === convId);
      if (found) return found;
    }

    let conv = this.conversations.find((c) => c.externalSessionId === input.externalSessionId);
    if (!conv) {
      conv = {
        id: crypto.randomUUID(),
        externalSessionId: input.externalSessionId,
        customerId: null,
        customerIdentifier: input.customerIdentifier,
        customerName: input.customerName || input.customerIdentifier,
        source: input.source,
        status: input.status || 'active',
        detectedIntent: input.detectedIntent || 'general_inquiry',
        linkedReservationId: input.linkedReservationId || null,
        linkedBookingReference: null,
        responseLatencyMs: input.responseLatencyMs ?? null,
        needsHumanAssistance: Boolean(input.needsHumanAssistance),
        lastMessageAt: now,
        isDemo: input.isDemo,
        createdAt: now,
        updatedAt: now,
        messages: [],
      };
      this.conversations.unshift(conv);
    } else {
      if (input.status) conv.status = input.status;
      if (input.detectedIntent) conv.detectedIntent = input.detectedIntent;
      if (input.linkedReservationId) conv.linkedReservationId = input.linkedReservationId;
      if (input.responseLatencyMs !== undefined) conv.responseLatencyMs = input.responseLatencyMs;
      if (input.needsHumanAssistance !== undefined) {
        conv.needsHumanAssistance = input.needsHumanAssistance;
      }
      conv.lastMessageAt = now;
      conv.updatedAt = now;
    }

    if (input.messages && input.messages.length > 0) {
      for (const msg of input.messages) {
        if (
          msg.externalMessageId &&
          conv.messages.some((m) => m.externalMessageId === msg.externalMessageId)
        ) {
          continue;
        }
        conv.messages.push({
          id: crypto.randomUUID(),
          conversationId: conv.id,
          externalMessageId: msg.externalMessageId || null,
          sender: msg.sender,
          content: msg.content,
          latencyMs: msg.latencyMs ?? null,
          createdAt: msg.createdAt || now,
        });
      }
    }

    if (conv.needsHumanAssistance) {
      await this.createNotification({
        type: 'human_assistance_requested',
        title: `Human Assistance Requested · ${conv.customerIdentifier}`,
        message: 'An AI conversation was flagged for direct manager follow-up.',
        reservationId: conv.linkedReservationId,
        conversationId: conv.id,
        isDemo: conv.isDemo,
      });
    }

    return conv;
  }

  async updateConversationStatus(
    id: string,
    isDemo: boolean,
    patch: { status?: ConversationStatus; needsHumanAssistance?: boolean; actor: string }
  ): Promise<ConversationRecord | null> {
    if (this.supabase) {
      const { data: existing } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .eq('is_demo', isDemo)
        .maybeSingle();
      if (!existing) return null;
      await this.supabase
        .from('conversations')
        .update({
          status: patch.status ?? existing.status,
          needs_human_assistance:
            patch.needsHumanAssistance !== undefined
              ? patch.needsHumanAssistance
              : existing.needs_human_assistance,
        })
        .eq('id', id);

      if (patch.needsHumanAssistance) {
        await this.createNotification({
          type: 'human_assistance_requested',
          title: `Marked for Human Assistance`,
          message: `${existing.customer_identifier} requires personal manager follow-up.`,
          reservationId: existing.linked_reservation_id,
          conversationId: id,
          isDemo,
        });
      }
      const list = await this.listConversations(isDemo);
      return list.find((c) => c.id === id) || null;
    }

    const conv = this.conversations.find((c) => c.id === id && c.isDemo === isDemo);
    if (!conv) return null;
    if (patch.status) conv.status = patch.status;
    if (patch.needsHumanAssistance !== undefined) {
      conv.needsHumanAssistance = patch.needsHumanAssistance;
    }
    conv.updatedAt = new Date().toISOString();

    if (patch.needsHumanAssistance) {
      await this.createNotification({
        type: 'human_assistance_requested',
        title: `Marked for Human Assistance · ${conv.customerIdentifier}`,
        message: `${conv.customerName || conv.customerIdentifier} was flagged by ${patch.actor}.`,
        reservationId: conv.linkedReservationId,
        conversationId: conv.id,
        isDemo,
      });
    }
    await this.recordActivity({
      entityType: 'conversation',
      entityId: conv.id,
      action: patch.needsHumanAssistance ? 'human_handover_flagged' : 'status_updated',
      actor: patch.actor,
      details: { status: conv.status },
      isDemo,
    });
    return conv;
  }

  async updateCustomerNotes(
    id: string,
    isDemo: boolean,
    notes: string,
    dietary?: string
  ): Promise<CustomerRecord | null> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('customers')
        .update({
          internal_notes: notes.trim(),
          ...(dietary !== undefined ? { dietary_requirements: dietary.trim() || null } : {}),
        })
        .eq('id', id)
        .eq('is_demo', isDemo)
        .select('*')
        .maybeSingle();
      return data ? this.mapSupabaseCustomer(data) : null;
    }

    const cust = this.customers.find((c) => c.id === id && c.isDemo === isDemo);
    if (!cust) return null;
    cust.internalNotes = notes.trim();
    if (dietary !== undefined) cust.dietaryRequirements = dietary.trim();
    cust.updatedAt = new Date().toISOString();
    return cust;
  }

  async createNotification(input: {
    type: NotificationType;
    title: string;
    message: string;
    reservationId?: string | null;
    conversationId?: string | null;
    isDemo: boolean;
  }): Promise<NotificationRecord> {
    const rec: NotificationRecord = {
      id: crypto.randomUUID(),
      type: input.type,
      title: input.title,
      message: input.message,
      isRead: false,
      reservationId: input.reservationId ?? null,
      conversationId: input.conversationId ?? null,
      isDemo: input.isDemo,
      createdAt: new Date().toISOString(),
    };
    if (this.supabase) {
      await this.supabase.from('notifications').insert({
        id: rec.id,
        type: rec.type,
        title: rec.title,
        message: rec.message,
        is_read: false,
        reservation_id: rec.reservationId,
        conversation_id: rec.conversationId,
        is_demo: rec.isDemo,
      });
    } else {
      this.notifications.unshift(rec);
    }
    return rec;
  }

  async markNotificationsRead(isDemo: boolean, id?: string): Promise<void> {
    if (this.supabase) {
      let query = this.supabase.from('notifications').update({ is_read: true }).eq('is_demo', isDemo);
      if (id) query = query.eq('id', id);
      await query;
      return;
    }
    for (const n of this.notifications) {
      if (n.isDemo === isDemo && (!id || n.id === id)) {
        n.isRead = true;
      }
    }
  }

  async recordActivity(input: {
    entityType: ActivityLogRecord['entityType'];
    entityId: string;
    action: string;
    actor: string;
    details: Record<string, unknown>;
    isDemo: boolean;
  }): Promise<void> {
    const rec: ActivityLogRecord = {
      id: crypto.randomUUID(),
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actor: input.actor,
      details: input.details,
      isDemo: input.isDemo,
      createdAt: new Date().toISOString(),
    };
    if (this.supabase) {
      await this.supabase.from('activity_logs').insert({
        id: rec.id,
        entity_type: rec.entityType,
        entity_id: rec.entityId,
        action: rec.action,
        actor: rec.actor,
        details: rec.details,
        is_demo: rec.isDemo,
      });
    } else {
      this.activityLogs.unshift(rec);
      if (this.activityLogs.length > 200) this.activityLogs.length = 200;
    }
  }

  async recordIntegrationEvent(
    input: IntegrationEventInput
  ): Promise<{ event: IntegrationEventRecord; duplicate: boolean }> {
    if (input.externalEventId) {
      if (this.supabase) {
        const { data: existing } = await this.supabase
          .from('integration_events')
          .select('*')
          .eq('external_event_id', input.externalEventId)
          .maybeSingle();
        if (existing) {
          return {
            duplicate: true,
            event: {
              id: String(existing.id),
              externalEventId: String(existing.external_event_id),
              eventType: String(existing.event_type),
              source: String(existing.source),
              status: existing.status as IntegrationEventRecord['status'],
              httpStatus: existing.http_status ? Number(existing.http_status) : null,
              summary: String(existing.summary),
              errorMessage: existing.error_message ? String(existing.error_message) : null,
              isDemo: Boolean(existing.is_demo),
              createdAt: String(existing.created_at),
            },
          };
        }
      } else {
        const existing = this.integrationEvents.find(
          (e) => e.externalEventId === input.externalEventId
        );
        if (existing) return { duplicate: true, event: existing };
      }
    }

    const rec: IntegrationEventRecord = {
      id: crypto.randomUUID(),
      externalEventId: input.externalEventId || null,
      eventType: input.eventType,
      source: input.source,
      status: input.status,
      httpStatus: input.httpStatus ?? null,
      summary: input.summary,
      errorMessage: input.errorMessage ?? null,
      isDemo: input.isDemo,
      createdAt: new Date().toISOString(),
    };

    if (this.supabase) {
      await this.supabase.from('integration_events').insert({
        id: rec.id,
        external_event_id: rec.externalEventId,
        event_type: rec.eventType,
        source: rec.source,
        status: rec.status,
        http_status: rec.httpStatus,
        summary: rec.summary,
        error_message: rec.errorMessage,
        is_demo: rec.isDemo,
      });
    } else {
      this.integrationEvents.unshift(rec);
      if (this.integrationEvents.length > 150) this.integrationEvents.length = 150;
    }

    if (rec.status === 'failed') {
      await this.createNotification({
        type: 'automation_integration_error',
        title: `Integration Error · ${rec.eventType}`,
        message: rec.errorMessage || rec.summary,
        isDemo: rec.isDemo,
      });
    }

    return { duplicate: false, event: rec };
  }

  async listReservations(isDemo: boolean): Promise<ReservationRecord[]> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('reservations')
        .select('*')
        .eq('is_demo', isDemo)
        .order('created_at', { ascending: false });
      return (data || []).map((r) => this.mapSupabaseReservation(r));
    }
    return this.reservations
      .filter((r) => r.isDemo === isDemo)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listCustomers(isDemo: boolean): Promise<CustomerRecord[]> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('customers')
        .select('*')
        .eq('is_demo', isDemo)
        .order('updated_at', { ascending: false });
      return (data || []).map((c) => this.mapSupabaseCustomer(c));
    }
    return this.customers
      .filter((c) => c.isDemo === isDemo)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async listConversations(isDemo: boolean): Promise<ConversationRecord[]> {
    if (this.supabase) {
      const { data: convs } = await this.supabase
        .from('conversations')
        .select('*, conversation_messages(*)')
        .eq('is_demo', isDemo)
        .order('last_message_at', { ascending: false });

      const reservations = await this.listReservations(isDemo);
      const customers = await this.listCustomers(isDemo);

      return (convs || []).map((cv: Record<string, unknown>) => {
        const linkedRes = cv.linked_reservation_id
          ? reservations.find((r) => r.id === String(cv.linked_reservation_id))
          : undefined;
        const linkedCust = cv.customer_id
          ? customers.find((c) => c.id === String(cv.customer_id))
          : undefined;
        const rawMessages = Array.isArray(cv.conversation_messages)
          ? (cv.conversation_messages as Array<Record<string, unknown>>)
          : [];
        const messages: ConversationMessageRecord[] = rawMessages
          .map((m) => ({
            id: String(m.id),
            conversationId: String(m.conversation_id),
            externalMessageId: m.external_message_id ? String(m.external_message_id) : null,
            sender: m.sender as ConversationMessageRecord['sender'],
            content: String(m.content),
            latencyMs: m.latency_ms ? Number(m.latency_ms) : null,
            createdAt: String(m.created_at),
          }))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

        return {
          id: String(cv.id),
          externalSessionId: String(cv.external_session_id),
          customerId: cv.customer_id ? String(cv.customer_id) : null,
          customerIdentifier: String(cv.customer_identifier),
          customerName: linkedCust?.fullName || linkedRes?.customerName || String(cv.customer_identifier),
          source: cv.source as ConversationSource,
          status: cv.status as ConversationStatus,
          detectedIntent: String(cv.detected_intent),
          linkedReservationId: cv.linked_reservation_id ? String(cv.linked_reservation_id) : null,
          linkedBookingReference: linkedRes?.bookingReference || null,
          responseLatencyMs: cv.response_latency_ms ? Number(cv.response_latency_ms) : null,
          needsHumanAssistance: Boolean(cv.needs_human_assistance),
          lastMessageAt: String(cv.last_message_at),
          isDemo: Boolean(cv.is_demo),
          createdAt: String(cv.created_at),
          updatedAt: String(cv.updated_at),
          messages,
        };
      });
    }

    return this.conversations
      .filter((c) => c.isDemo === isDemo)
      .map((c) => {
        const linkedRes = c.linkedReservationId
          ? this.reservations.find((r) => r.id === c.linkedReservationId)
          : null;
        return {
          ...c,
          linkedBookingReference: linkedRes?.bookingReference || c.linkedBookingReference,
          messages: [...c.messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        };
      })
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }

  async listNotifications(isDemo: boolean): Promise<NotificationRecord[]> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('is_demo', isDemo)
        .order('created_at', { ascending: false })
        .limit(100);
      return (data || []).map((n: Record<string, unknown>) => ({
        id: String(n.id),
        type: n.type as NotificationType,
        title: String(n.title),
        message: String(n.message),
        isRead: Boolean(n.is_read),
        reservationId: n.reservation_id ? String(n.reservation_id) : null,
        conversationId: n.conversation_id ? String(n.conversation_id) : null,
        isDemo: Boolean(n.is_demo),
        createdAt: String(n.created_at),
      }));
    }
    return this.notifications
      .filter((n) => n.isDemo === isDemo)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listActivityLogs(isDemo: boolean): Promise<ActivityLogRecord[]> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('activity_logs')
        .select('*')
        .eq('is_demo', isDemo)
        .order('created_at', { ascending: false })
        .limit(100);
      return (data || []).map((a: Record<string, unknown>) => ({
        id: String(a.id),
        entityType: a.entity_type as ActivityLogRecord['entityType'],
        entityId: String(a.entity_id),
        action: String(a.action),
        actor: String(a.actor),
        details: (a.details as Record<string, unknown>) || {},
        isDemo: Boolean(a.is_demo),
        createdAt: String(a.created_at),
      }));
    }
    return this.activityLogs
      .filter((a) => a.isDemo === isDemo)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listIntegrationEvents(isDemo: boolean): Promise<IntegrationEventRecord[]> {
    if (this.supabase) {
      const { data } = await this.supabase
        .from('integration_events')
        .select('*')
        .eq('is_demo', isDemo)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []).map((e: Record<string, unknown>) => ({
        id: String(e.id),
        externalEventId: e.external_event_id ? String(e.external_event_id) : null,
        eventType: String(e.event_type),
        source: String(e.source),
        status: e.status as IntegrationEventRecord['status'],
        httpStatus: e.http_status ? Number(e.http_status) : null,
        summary: String(e.summary),
        errorMessage: e.error_message ? String(e.error_message) : null,
        isDemo: Boolean(e.is_demo),
        createdAt: String(e.created_at),
      }));
    }
    return this.integrationEvents
      .filter((e) => e.isDemo === isDemo)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getWorkspaceSnapshot(isDemo: boolean): Promise<WorkspaceSnapshot> {
    const { dateStr, timeStr } = getKarachiDateAndTime();
    const [
      reservations,
      customers,
      conversations,
      notifications,
      activityLogs,
      settings,
      integrationEvents,
      integrationStatus,
    ] = await Promise.all([
      this.listReservations(isDemo),
      this.listCustomers(isDemo),
      this.listConversations(isDemo),
      this.listNotifications(isDemo),
      this.listActivityLogs(isDemo),
      this.getSettings(),
      this.listIntegrationEvents(isDemo),
      this.getIntegrationStatus(isDemo),
    ]);

    return {
      workspace: isDemo ? 'demo' : 'production',
      storageMode: this.getStorageMode(),
      karachiToday: dateStr,
      karachiNowTime: timeStr,
      reservations,
      customers,
      conversations,
      notifications,
      activityLogs,
      settings,
      integrationEvents,
      integrationStatus,
    };
  }
}

export const repository = new MemoryAndSupabaseStore();

// Server-side Manager Auth Service for Production /api/admin/* endpoints
const SESSION_SIGNING_KEY = crypto.randomBytes(32);
let claimedPasscodeHash: string | null = null;
let claimedSalt: string | null = null;

function hashPasscode(passcode: string, salt: string): string {
  return crypto.scryptSync(passcode, salt, 64).toString('hex');
}

export function getAdminAuthStatus() {
  const envPass = (process.env.MANAGER_ACCESS_PASSCODE || '').trim();
  return {
    envConfigured: Boolean(envPass),
    passcodeSet: Boolean(envPass || claimedPasscodeHash),
  };
}

export function claimFirstRunManagerPasscode(passcode: string): boolean {
  const envPass = (process.env.MANAGER_ACCESS_PASSCODE || '').trim();
  if (envPass || claimedPasscodeHash) return false;
  if (passcode.trim().length < 8) return false;
  const salt = crypto.randomBytes(16).toString('hex');
  claimedSalt = salt;
  claimedPasscodeHash = hashPasscode(passcode.trim(), salt);
  return true;
}

export function verifyManagerPasscode(input: string): boolean {
  const envPass = (process.env.MANAGER_ACCESS_PASSCODE || '').trim();
  if (envPass) {
    const a = Buffer.from(input);
    const b = Buffer.from(envPass);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  if (claimedPasscodeHash && claimedSalt) {
    const candidate = Buffer.from(hashPasscode(input, claimedSalt), 'hex');
    const stored = Buffer.from(claimedPasscodeHash, 'hex');
    return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
  }
  return false;
}

export function issueManagerBearerToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'manager',
      exp: Date.now() + 8 * 60 * 60 * 1000,
      jti: crypto.randomUUID(),
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SIGNING_KEY)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyManagerBearerToken(authHeader?: string): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7).trim();
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SIGNING_KEY)
    .update(payload)
    .digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded.role === 'manager' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export function verifyN8nBearerToken(authHeader?: string): { ok: boolean; configured: boolean } {
  const secret = (process.env.N8N_INTEGRATION_SECRET || '').trim();
  if (!secret) return { ok: false, configured: false };
  if (!authHeader || !authHeader.startsWith('Bearer ')) return { ok: false, configured: true };
  const token = authHeader.slice(7).trim();
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return {
    ok: a.length === b.length && crypto.timingSafeEqual(a, b),
    configured: true,
  };
}
