export type ReservationSource = 'website' | 'whatsapp_ai' | 'manual' | 'web_ai_demo';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'seated'
  | 'completed'
  | 'no_show';

export type ManagementSeating = 'rooftop' | 'indoor' | 'no-preference';

export interface ReservationStatusHistoryEntry {
  status: ReservationStatus;
  changedAt: string;
  actor: string;
  note?: string;
}

export interface ReservationRecord {
  id: string;
  bookingReference: string;
  customerId: string;
  externalEventId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  guestCity: string;
  reservationDate: string; // YYYY-MM-DD
  reservationTime: string; // HH:mm or readable session string
  guestCount: number;
  seatingPreference: ManagementSeating;
  specialOccasion: string;
  specialRequests: string;
  dietaryRequirements: string;
  source: ReservationSource;
  status: ReservationStatus;
  conversationId: string | null;
  managerNotes: string;
  statusHistory: ReservationStatusHistoryEntry[];
  lastOutboundNotificationStatus:
    | 'not_configured'
    | 'sent'
    | 'failed'
    | 'skipped_demo';
  lastOutboundEventId: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRecord {
  id: string;
  fullName: string;
  phoneNormalized: string;
  phoneDisplay: string;
  email: string;
  preferredSeating: ManagementSeating;
  dietaryRequirements: string;
  previousOccasions: string[];
  internalNotes: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ConversationSource = 'whatsapp_ai' | 'web_ai_demo';

export type ConversationStatus =
  | 'active'
  | 'reservation_requested'
  | 'awaiting_manager'
  | 'human_handover_requested'
  | 'resolved';

export interface ConversationMessageRecord {
  id: string;
  conversationId: string;
  externalMessageId: string | null;
  sender: 'customer' | 'assistant' | 'system';
  content: string;
  latencyMs: number | null;
  createdAt: string;
}

export interface ConversationRecord {
  id: string;
  externalSessionId: string;
  customerId: string | null;
  customerIdentifier: string;
  customerName: string;
  source: ConversationSource;
  status: ConversationStatus;
  detectedIntent: string;
  linkedReservationId: string | null;
  linkedBookingReference: string | null;
  responseLatencyMs: number | null;
  needsHumanAssistance: boolean;
  lastMessageAt: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessageRecord[];
}

export type NotificationType =
  | 'new_website_reservation'
  | 'new_whatsapp_ai_reservation'
  | 'new_web_ai_demo_reservation'
  | 'pending_booking_approval'
  | 'cancellation_requested'
  | 'reschedule_requested'
  | 'human_assistance_requested'
  | 'special_occasion_booking'
  | 'automation_integration_error';

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  reservationId: string | null;
  conversationId: string | null;
  isDemo: boolean;
  createdAt: string;
}

export interface ActivityLogRecord {
  id: string;
  entityType: 'reservation' | 'conversation' | 'customer' | 'settings' | 'integration';
  entityId: string;
  action: string;
  actor: string;
  details: Record<string, unknown>;
  isDemo: boolean;
  createdAt: string;
}

export interface RestaurantSettingsRecord {
  id: string;
  operatingDays: string[];
  openingTime: string | null;
  closingTime: string | null;
  hoursConfigured: boolean;
  timeSlots: string[];
  reservationDurationMinutes: number;
  rooftopCapacity: number | null;
  indoorCapacity: number | null;
  maxGuestCount: number | null;
  capacityConfigured: boolean;
  capacityIsSample: boolean;
  closureDates: string[];
  requireManagerApproval: boolean;
  n8nOutboundEnabled: boolean;
  updatedAt: string;
}

export interface IntegrationEventRecord {
  id: string;
  externalEventId: string | null;
  eventType: string;
  source: string;
  status: 'success' | 'duplicate' | 'failed' | 'not_configured';
  httpStatus: number | null;
  summary: string;
  errorMessage: string | null;
  isDemo: boolean;
  createdAt: string;
}

export type IntegrationConnectionState =
  | 'not_configured'
  | 'configured_unverified'
  | 'connected'
  | 'error'
  | 'demo_mode';

export interface IntegrationStatusSummary {
  storageMode: 'supabase' | 'demo_memory';
  databaseState: IntegrationConnectionState;
  n8nInboundState: IntegrationConnectionState;
  n8nChatProxyState: IntegrationConnectionState;
  n8nStatusWebhookState: IntegrationConnectionState;
  whatsappCloudState: IntegrationConnectionState;
  whatsappTestNumberConfigured: boolean;
  whatsappTestNumberDisplay: string | null;
  managerNotificationsState: IntegrationConnectionState;
  lastSuccessfulEvent: IntegrationEventRecord | null;
  lastFailedEvent: IntegrationEventRecord | null;
  checkedAt: string;
}

export interface WorkspaceSnapshot {
  workspace: 'demo' | 'production';
  storageMode: 'supabase' | 'demo_memory';
  karachiToday: string;
  karachiNowTime: string;
  reservations: ReservationRecord[];
  customers: CustomerRecord[];
  conversations: ConversationRecord[];
  notifications: NotificationRecord[];
  activityLogs: ActivityLogRecord[];
  settings: RestaurantSettingsRecord;
  integrationEvents: IntegrationEventRecord[];
  integrationStatus: IntegrationStatusSummary;
}
