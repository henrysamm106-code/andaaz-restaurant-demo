import { RESTAURANT } from '../data/restaurant';
import type { ExperienceSlug } from '../data/experiences';

export const DINNER_TIME_SLOTS = [
  { value: '17:00', label: '5:00 PM', hour: 17 },
  { value: '18:00', label: '6:00 PM', hour: 18 },
  { value: '19:00', label: '7:00 PM', hour: 19 },
  { value: '20:00', label: '8:00 PM', hour: 20 },
  { value: '21:00', label: '9:00 PM', hour: 21 },
  { value: '22:00', label: '10:00 PM', hour: 22 },
] as const;

export const CUSTOM_OCCASION_TIME_SUGGESTIONS = [
  '10:30 AM (Morning Brunch)',
  '12:00 PM (Midday Gathering)',
  '1:30 PM (Afternoon)',
  '7:00 PM (Evening Reception)',
  '8:00 PM (Dinner Reception)',
] as const;

export const OCCASION_LABELS: Record<ExperienceSlug, string> = {
  'private-brunch': 'Private Brunch',
  'corporate-hosting': 'Corporate Hosting',
  'dinner-with-music': 'Dinner with Music',
  celebrations: 'Celebrations',
  'wedding-gatherings': 'Wedding Gatherings',
  'anniversary-dinner': 'Anniversary Dinner',
};

export type ReservationMode = 'dinner' | 'occasion';
export type SeatingPreference = 'rooftop' | 'indoor' | 'no-preference';

export interface ReservationDraft {
  mode: ReservationMode;
  occasionType: ExperienceSlug | '';
  date: string; // YYYY-MM-DD in Asia/Karachi
  time: string; // e.g. '20:00' for dinner, or custom session string for brunch/events
  guests: number;
  guestCity: string; // City from which the guest is making the enquiry
  seating: SeatingPreference;
  notes: string;
  name: string;
  phone: string;
  email: string;
}

export function getKarachiNowParts(): {
  dateStr: string;
  hour: number;
  minute: number;
  weekday: string;
} {
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: RESTAURANT.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: RESTAURANT.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: RESTAURANT.timeZone,
    weekday: 'long',
  });

  const dateStr = dateFormatter.format(now); // YYYY-MM-DD
  const [hStr, mStr] = timeFormatter.format(now).split(':');
  return {
    dateStr,
    hour: Number(hStr),
    minute: Number(mStr),
    weekday: weekdayFormatter.format(now),
  };
}

export function getKarachiToday(): string {
  return getKarachiNowParts().dateStr;
}

export function getKarachiTomorrow(): string {
  const today = getKarachiToday();
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return dt.toISOString().slice(0, 10);
}

export function isDatePastInKarachi(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return true;
  return dateStr < getKarachiToday();
}

export function isDinnerSlotPastToday(dateStr: string, slotValue: string): boolean {
  const karachi = getKarachiNowParts();
  if (dateStr !== karachi.dateStr) return false;
  const slotHour = Number(slotValue.split(':')[0]);
  if (Number.isNaN(slotHour)) return false;
  // Disable slot if current Karachi hour has already reached or passed that hour
  return karachi.hour > slotHour || (karachi.hour === slotHour && karachi.minute > 0);
}

export function formatFullDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(utc);
}

export function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return '';
  const match = DINNER_TIME_SLOTS.find((s) => s.value === timeStr);
  if (match) return `${match.label} Pakistan time`;
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${suffix} Pakistan time`;
  }
  return `${timeStr} (Pakistan time)`;
}

export function validatePhoneNumber(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return 'Please enter a mobile number so the restaurant can confirm your request.';
  if (!/^[+\d\s().-]+$/.test(trimmed)) {
    return 'Please use digits, spaces, parentheses, dashes, or a leading + country code.';
  }
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return 'Please enter a valid international or Pakistani mobile number (7 to 15 digits).';
  }
  return null;
}

export function validateOptionalEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Please enter a valid email address or leave this field blank.';
  }
  return null;
}

export function formatSeatingLabel(seating: SeatingPreference): string {
  if (seating === 'rooftop') return 'Open-air rooftop (preference, subject to confirmation)';
  if (seating === 'indoor') return 'Indoor dining room (preference, subject to confirmation)';
  return '';
}

export function buildWhatsAppRequestMessage(draft: ReservationDraft): string {
  const lines: string[] = [
    'Assalam-o-Alaikum Andaaz Restaurant team,',
    '',
    'I would like to submit a reservation REQUEST with the following details:',
    `- Branch: ${RESTAURANT.branch} (${RESTAURANT.phoneDisplay})`,
  ];

  if (draft.guestCity.trim()) {
    lines.push(`- Booking From City: ${draft.guestCity.trim()}`);
  }

  lines.push(`- Name: ${draft.name.trim()}`);
  lines.push(`- Contact Number: ${draft.phone.trim()}`);

  if (draft.email.trim()) {
    lines.push(`- Email: ${draft.email.trim()}`);
  }

  if (draft.mode === 'occasion' && draft.occasionType) {
    lines.push(`- Request Type: ${OCCASION_LABELS[draft.occasionType]}`);
  } else if (draft.mode === 'occasion') {
    lines.push('- Request Type: Private / Hosted Occasion');
  } else {
    lines.push('- Request Type: Dinner Table');
  }

  lines.push(`- Date: ${formatFullDate(draft.date)}`);
  lines.push(`- Preferred Arrival Time: ${formatTimeDisplay(draft.time)}`);
  lines.push(`- Guests: ${draft.guests}`);

  const seatingLabel = formatSeatingLabel(draft.seating);
  if (seatingLabel) {
    lines.push(`- Seating Preference: ${seatingLabel}`);
  }

  if (draft.notes.trim()) {
    lines.push(`- Notes: ${draft.notes.trim()}`);
  }

  lines.push('');
  lines.push('Could your team please confirm availability and arrangements?');

  return lines.join('\n');
}

export function buildFixedWhatsAppUrl(message: string): string {
  return `https://wa.me/${RESTAURANT.whatsappDigits}?text=${encodeURIComponent(message)}`;
}
