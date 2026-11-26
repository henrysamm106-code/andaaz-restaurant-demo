import type {
  ConversationRecord,
  CustomerRecord,
  ReservationRecord,
  ReservationSource,
  ReservationStatus,
  RestaurantSettingsRecord,
} from '../types/management';

export type DateRangePreset = 'today' | '7d' | '30d' | 'all' | 'custom';

export interface DateRangeFilter {
  preset: DateRangePreset;
  customStart?: string;
  customEnd?: string;
}

export function addDaysToDateStr(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

export function getKarachiDatePart(isoTs: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(isoTs));
  } catch {
    return isoTs.slice(0, 10);
  }
}

export function getKarachiTimeAndWeekday(isoTs: string): { time: string; weekday: string } {
  try {
    const dt = new Date(isoTs);
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(dt);
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      weekday: 'long',
    }).format(dt);
    return { time, weekday };
  } catch {
    return { time: '12:00', weekday: 'Monday' };
  }
}

export function isTimestampAfterHours(
  isoTs: string,
  settings: RestaurantSettingsRecord
): boolean | null {
  if (!settings.hoursConfigured || !settings.openingTime || !settings.closingTime) {
    return null;
  }
  const { time, weekday } = getKarachiTimeAndWeekday(isoTs);
  if (settings.operatingDays.length > 0 && !settings.operatingDays.includes(weekday)) {
    return true;
  }
  const toMins = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const current = toMins(time);
  const open = toMins(settings.openingTime);
  const close = toMins(settings.closingTime);
  if (close >= open) {
    return current < open || current > close;
  }
  // Overnight closing (e.g. 17:00 to 00:30)
  return current < open && current > close;
}

export function resolveDateBounds(
  filter: DateRangeFilter,
  karachiToday: string
): { start: string | null; end: string | null } {
  if (filter.preset === 'today') {
    return { start: karachiToday, end: karachiToday };
  }
  if (filter.preset === '7d') {
    return { start: addDaysToDateStr(karachiToday, -6), end: karachiToday };
  }
  if (filter.preset === '30d') {
    return { start: addDaysToDateStr(karachiToday, -29), end: karachiToday };
  }
  if (filter.preset === 'custom') {
    return {
      start: filter.customStart || null,
      end: filter.customEnd || null,
    };
  }
  return { start: null, end: null };
}

export function filterReservationsByRange(
  reservations: ReservationRecord[],
  filter: DateRangeFilter,
  karachiToday: string
): ReservationRecord[] {
  const { start, end } = resolveDateBounds(filter, karachiToday);
  if (!start && !end) return reservations;
  return reservations.filter((r) => {
    // Include bookings scheduled in range OR created in range so newly submitted future bookings stay visible in Today/7d/30d views
    const createdDate = getKarachiDatePart(r.createdAt);
    const matchScheduled =
      (!start || r.reservationDate >= start) && (!end || r.reservationDate <= end);
    const matchCreated =
      (!start || createdDate >= start) && (!end || createdDate <= end);
    return filter.preset === 'today' ? r.reservationDate === karachiToday : matchScheduled || matchCreated;
  });
}

export function filterConversationsByRange(
  conversations: ConversationRecord[],
  filter: DateRangeFilter,
  karachiToday: string
): ConversationRecord[] {
  const { start, end } = resolveDateBounds(filter, karachiToday);
  if (!start && !end) return conversations;
  return conversations.filter((c) => {
    const dt = getKarachiDatePart(c.lastMessageAt || c.createdAt);
    if (start && dt < start) return false;
    if (end && dt > end) return false;
    return true;
  });
}

export interface DashboardMetrics {
  totalReservations: number;
  todayReservations: number;
  todayGuestsExpected: number;
  pendingApproval: number;
  confirmedCount: number;
  cancelledOrRejectedCount: number;
  aiCreatedReservations: number;
  websiteReservations: number;
  manualReservations: number;
  activeAiConversations: number;
  humanAssistanceCount: number;
  aiConversionRate: number | null; // %
  eligibleAiConversations: number;
  afterHoursRequests: number | null;
  avgAiResponseMs: number | null;
  repeatGuestCount: number;
  byDate: Array<{ date: string; total: number; guests: number; ai: number; website: number }>;
  bySource: Array<{ source: ReservationSource; label: string; count: number; percentage: number }>;
  byStatus: Array<{ status: ReservationStatus; label: string; count: number }>;
  peakHours: Array<{ slot: string; count: number }>;
  topOccasions: Array<{ occasion: string; count: number }>;
}

const SOURCE_LABELS: Record<ReservationSource, string> = {
  whatsapp_ai: 'WhatsApp AI',
  website: 'Website Form',
  manual: 'Manual Staff',
  web_ai_demo: 'Web AI Demo',
};

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  seated: 'Seated',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  no_show: 'No Show',
};

export function computeDashboardMetrics(
  allReservations: ReservationRecord[],
  allConversations: ConversationRecord[],
  allCustomers: CustomerRecord[],
  settings: RestaurantSettingsRecord,
  karachiToday: string,
  range: DateRangeFilter = { preset: 'all' }
): DashboardMetrics {
  const reservations = filterReservationsByRange(allReservations, range, karachiToday);
  const conversations = filterConversationsByRange(allConversations, range, karachiToday);

  const todayList = allReservations.filter((r) => r.reservationDate === karachiToday);
  const todayActiveGuests = todayList
    .filter((r) => ['pending', 'confirmed', 'seated', 'completed'].includes(r.status))
    .reduce((sum, r) => sum + r.guestCount, 0);

  const pendingApproval = reservations.filter((r) => r.status === 'pending').length;
  const confirmedCount = reservations.filter((r) => r.status === 'confirmed').length;
  const cancelledOrRejectedCount = reservations.filter(
    (r) => r.status === 'cancelled' || r.status === 'rejected'
  ).length;

  const aiCreatedReservations = reservations.filter(
    (r) => r.source === 'whatsapp_ai' || r.source === 'web_ai_demo'
  ).length;
  const websiteReservations = reservations.filter((r) => r.source === 'website').length;
  const manualReservations = reservations.filter((r) => r.source === 'manual').length;

  const activeAiConversations = allConversations.filter((c) => c.status !== 'resolved').length;
  const humanAssistanceCount = allConversations.filter(
    (c) => c.needsHumanAssistance && c.status !== 'resolved'
  ).length;

  // AI conversion rate: AI conversations in range with >= 1 message that produced a stored reservation
  const linkedConvIds = new Set(
    allReservations.map((r) => r.conversationId).filter((v): v is string => Boolean(v))
  );
  const eligibleConvs = conversations.filter((c) => c.messages.length > 0);
  const convertedConvs = eligibleConvs.filter(
    (c) => Boolean(c.linkedReservationId) || linkedConvIds.has(c.id)
  );
  const aiConversionRate =
    eligibleConvs.length > 0
      ? Math.round((convertedConvs.length / eligibleConvs.length) * 1000) / 10
      : null;

  // After-hours metric strictly from configured Asia/Karachi hours
  let afterHoursRequests: number | null = null;
  if (settings.hoursConfigured && settings.openingTime && settings.closingTime) {
    let count = 0;
    for (const r of reservations) {
      if (isTimestampAfterHours(r.createdAt, settings) === true) count += 1;
    }
    afterHoursRequests = count;
  }

  // Avg AI response latency from measured message / conversation latencies
  const latencies: number[] = [];
  for (const c of conversations) {
    if (typeof c.responseLatencyMs === 'number' && c.responseLatencyMs > 0) {
      latencies.push(c.responseLatencyMs);
    }
  }
  const avgAiResponseMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

  // Repeat guests: customers with >= 2 non-cancelled, non-rejected reservations
  const customerBookingCount = new Map<string, number>();
  for (const r of allReservations) {
    if (r.status !== 'cancelled' && r.status !== 'rejected') {
      customerBookingCount.set(r.customerId, (customerBookingCount.get(r.customerId) || 0) + 1);
    }
  }
  const repeatGuestCount = allCustomers.filter(
    (c) => (customerBookingCount.get(c.id) || 0) >= 2
  ).length;

  // Grouping by date
  const dateMap = new Map<string, { total: number; guests: number; ai: number; website: number }>();
  for (const r of reservations) {
    const existing = dateMap.get(r.reservationDate) || { total: 0, guests: 0, ai: 0, website: 0 };
    existing.total += 1;
    existing.guests += r.guestCount;
    if (r.source === 'whatsapp_ai' || r.source === 'web_ai_demo') existing.ai += 1;
    if (r.source === 'website') existing.website += 1;
    dateMap.set(r.reservationDate, existing);
  }
  const byDate = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({ date, ...stats }));

  // Grouping by source
  const sourceOrder: ReservationSource[] = ['whatsapp_ai', 'website', 'manual', 'web_ai_demo'];
  const totalCount = reservations.length;
  const bySource = sourceOrder.map((src) => {
    const count = reservations.filter((r) => r.source === src).length;
    return {
      source: src,
      label: SOURCE_LABELS[src],
      count,
      percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
    };
  });

  // Grouping by status
  const statusOrder: ReservationStatus[] = [
    'pending',
    'confirmed',
    'seated',
    'completed',
    'cancelled',
    'rejected',
    'no_show',
  ];
  const byStatus = statusOrder.map((st) => ({
    status: st,
    label: STATUS_LABELS[st],
    count: reservations.filter((r) => r.status === st).length,
  }));

  // Peak arrival hours
  const slotMap = new Map<string, number>();
  for (const r of reservations) {
    const slot = r.reservationTime || 'Unspecified';
    slotMap.set(slot, (slotMap.get(slot) || 0) + 1);
  }
  const peakHours = Array.from(slotMap.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([slot, count]) => ({ slot, count }));

  // Top occasions
  const occMap = new Map<string, number>();
  for (const r of reservations) {
    const occ = r.specialOccasion.trim() || 'Standard Dinner';
    occMap.set(occ, (occMap.get(occ) || 0) + 1);
  }
  const topOccasions = Array.from(occMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([occasion, count]) => ({ occasion, count }));

  return {
    totalReservations: reservations.length,
    todayReservations: todayList.length,
    todayGuestsExpected: todayActiveGuests,
    pendingApproval,
    confirmedCount,
    cancelledOrRejectedCount,
    aiCreatedReservations,
    websiteReservations,
    manualReservations,
    activeAiConversations,
    humanAssistanceCount,
    aiConversionRate,
    eligibleAiConversations: eligibleConvs.length,
    afterHoursRequests,
    avgAiResponseMs,
    repeatGuestCount,
    byDate,
    bySource,
    byStatus,
    peakHours,
    topOccasions,
  };
}

function escapeCsvCell(raw: unknown): string {
  let val = String(raw ?? '');
  if (/^[=+\-@\t\r]/.test(val)) {
    val = `'${val}`;
  }
  if (/[",\n\r]/.test(val)) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function buildReservationsCsv(reservations: ReservationRecord[]): string {
  const headers = [
    'Booking Reference',
    'Status',
    'Source',
    'Reservation Date',
    'Arrival Time',
    'Guests',
    'Seating Preference',
    'Customer Name',
    'Phone',
    'Email',
    'Enquiring City',
    'Special Occasion',
    'Dietary Requirements',
    'Special Requests',
    'Manager Notes',
    'Created At (ISO)',
  ];
  const rows = reservations.map((r) =>
    [
      r.bookingReference,
      r.status,
      r.source,
      r.reservationDate,
      r.reservationTime,
      r.guestCount,
      r.seatingPreference,
      r.customerName,
      r.customerPhone,
      r.customerEmail,
      r.guestCity,
      r.specialOccasion,
      r.dietaryRequirements,
      r.specialRequests,
      r.managerNotes,
      r.createdAt,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
}
