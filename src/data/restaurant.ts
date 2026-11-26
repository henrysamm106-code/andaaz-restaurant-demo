export const RESTAURANT = {
  name: 'Andaaz Restaurant',
  branch: 'Fort Road, Lahore',
  address: '2189 A Fort Road, Shahi Mohallah, Walled City of Lahore, Lahore, Punjab 54000, Pakistan',
  shortAddress: '2189 A Fort Road, Walled City of Lahore',
  landmark: 'Opposite Badshahi Masjid',
  servingSince: 2007,
  cuisines: ['Pakistani', 'Lahori', 'South Asian'],
  spaces: ['Indoor dining', 'Open-air rooftop dining'],
  floorsReported: 4,
  phoneE164: '+923000263229',
  phoneDisplay: '+92 300 0263229',
  whatsappDigits: '923000263229',
  whatsappBaseUrl: 'https://wa.me/923000263229',
  website: 'https://andaazrestaurant.com/',
  officialReservationPage: 'https://andaazrestaurant.com/reservation-page',
  officialMenuPage: 'https://andaazrestaurant.com/andaaz-menu',
  officialMenuPdfViewer: 'https://drive.google.com/file/d/1B8kbw03wP5-mk9l1lg51bvs9-bLLXl5F/preview',
  localMenuPdf: '/assets/Andaaz-Official-Menu.pdf',
  instagram: 'https://www.instagram.com/andaazrestaurantlahore/',
  facebook: 'https://www.facebook.com/AndaazRestaurant',
  mapsUrl: 'https://www.google.com/maps/search/Andaaz+Restaurant+Lahore+Walled+City',
  timeZone: 'Asia/Karachi',
  corporateCapacity: {
    maxGuestsAdvertised: 200,
    qualification: 'Across floors and dining spaces; event-specific capacity and availability require staff confirmation.',
  },
  singleLocationNote:
    'Andaaz Restaurant (andaazrestaurant.com) operates one heritage flagship house on Fort Road, Walled City of Lahore. It does not operate branches in Gulberg, DHA, Karachi, or Islamabad.',
  notVerified: [
    'Weekly opening and closing schedule',
    'Current table inventory',
    'Live prices, taxes and service-charge policy',
    'Cancellation or deposit terms',
    'Response time',
    'Restaurant email address',
    'Parking or lift access for restaurant guests',
    'Dish-specific allergy guarantees',
    'Awards and review scores',
  ],
} as const;

export interface RestaurantBranch {
  id: string;
  name: string;
  city: string;
  address: string;
  landmark: string;
  phoneDisplay: string;
  phoneE164: string;
  whatsappDigits: string;
  menuLabel: string;
  spacesNote: string;
  photoIds: string[];
}

export const OFFICIAL_BRANCHES: RestaurantBranch[] = [
  {
    id: 'fort-road-lahore',
    name: 'Fort Road, Walled City of Lahore (Sole Flagship House)',
    city: 'Lahore',
    address: '2189 A Fort Road, Shahi Mohallah, Walled City of Lahore, Lahore, Punjab 54000, Pakistan',
    landmark: 'Opposite Badshahi Masjid',
    phoneDisplay: '+92 300 0263229',
    phoneE164: '+923000263229',
    whatsappDigits: '923000263229',
    menuLabel: 'Fort Road, Lahore — Full 3-Page House Menu',
    spacesNote: 'Four floors featuring open-air rooftop terraces and glass-sided indoor dining salons.',
    photoIds: [
      'rooftop-table-landscape',
      'dining-room-landscape',
      'mosque-night-landscape',
      'private-dining-room',
    ],
  },
];

export const BOOKING_CITY_OPTIONS = [
  'Lahore',
  'Islamabad / Rawalpindi',
  'Karachi',
  'Multan',
  'Faisalabad',
  'Visiting from Abroad',
] as const;

export const FAQ_ITEMS = [
  {
    question: 'How do table requests and confirmations work?',
    answer:
      'Dinner is by reservation request. You can prepare your request here and continue in WhatsApp (+92 300 0263229) or use the official reservation page. All requests remain subject to confirmation from the restaurant team.',
  },
  {
    question: 'Can we guarantee rooftop seating in advance?',
    answer:
      'Both open-air rooftop seating overlooking Badshahi Masjid and indoor dining rooms are available as preferences. Final table placement is confirmed by the restaurant team for your chosen evening.',
  },
  {
    question: 'Are private brunches, live music, or large corporate gatherings offered daily?',
    answer:
      'Private brunches, hosted celebrations, wedding gatherings, and live music arrangements are planned enquiries rather than guaranteed daily service. Corporate events can be discussed for up to 200 guests across our dining spaces, subject to confirmation.',
  },
  {
    question: 'Where can we verify current prices, dietary needs, or parking near Fort Road?',
    answer:
      'Printed prices are shown in the scanned official menu PDF and may change. For allergy or ingredient confirmation, opening schedules, or arrival guidance on Fort Road, please speak directly with the restaurant on +92 300 0263229.',
  },
];

export interface RouteMeta {
  title: string;
  description: string;
}

export const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'Andaaz Restaurant — Fort Road, Lahore',
    description:
      'Pakistani dining overlooking Badshahi Masjid from Fort Road in the Walled City of Lahore. Serving since 2007 across indoor dining rooms and open-air rooftop terraces.',
  },
  '/our-story': {
    title: 'The House — Andaaz Restaurant, Fort Road, Lahore',
    description:
      'Discover the four-floor heritage house on Fort Road opposite Badshahi Masjid, home to Andaaz Restaurant in the Walled City of Lahore since 2007.',
  },
  '/menu': {
    title: 'Menu Highlights & Official PDF — Andaaz Restaurant, Lahore',
    description:
      'Explore verified menu highlights across Tandoor, Karahi, Seafood, Desserts, and Drinks, or view the full three-page official Andaaz Restaurant menu PDF.',
  },
  '/gallery': {
    title: 'Gallery — Andaaz Restaurant, Fort Road, Lahore',
    description:
      'Photographs of rooftop evenings, indoor dining rooms, hosted gatherings, and views of Badshahi Masjid from Andaaz Restaurant in Lahore.',
  },
  '/reservations': {
    title: 'Request a Table — Andaaz Restaurant, Fort Road, Lahore',
    description:
      'Prepare a guided dinner or private occasion reservation request for Andaaz Restaurant on Fort Road, Lahore, with direct WhatsApp and official form handoff.',
  },
  '/experiences': {
    title: 'Hosted Experiences — Andaaz Restaurant, Fort Road, Lahore',
    description:
      'Private brunches, corporate hosting, evenings with music, celebrations, wedding gatherings, and anniversary dinners at Andaaz Restaurant, Lahore.',
  },
  '/contact': {
    title: 'Contact & Directions — Andaaz Restaurant, Fort Road, Lahore',
    description:
      'Visit Andaaz Restaurant at 2189 A Fort Road, Shahi Mohallah, opposite Badshahi Masjid, Lahore. Telephone and WhatsApp: +92 300 0263229.',
  },
  '/staff-demo': {
    title: 'Operations Overview — Andaaz Management Demo',
    description: 'Reservation operations overview and AI Concierge monitoring for Andaaz Restaurant.',
  },
  '/staff-demo/reservations': {
    title: 'Reservations — Andaaz Management Demo',
    description: 'Manage reservation requests, pending approvals, seating preferences, and guest notes.',
  },
  '/staff-demo/calendar': {
    title: 'Reservation Calendar — Andaaz Management Demo',
    description: 'Daily, weekly, and monthly Fort Road reservation schedule and slot inspection.',
  },
  '/staff-demo/ai-concierge': {
    title: 'AI Concierge — Andaaz Management Demo',
    description: 'Monitor WhatsApp AI and Web AI Concierge conversations and handover flags.',
  },
  '/staff-demo/customers': {
    title: 'Customers — Andaaz Management Demo',
    description: 'Deduplicated guest directory, visit counts, occasions, and hospitality notes.',
  },
  '/staff-demo/notifications': {
    title: 'Notifications — Andaaz Management Demo',
    description: 'Real-time reservation requests, approvals, and integration status alerts.',
  },
  '/staff-demo/analytics': {
    title: 'Analytics & Reports — Andaaz Management Demo',
    description: 'Booking channel attribution, AI conversion tracking, and CSV reservation exports.',
  },
  '/staff-demo/availability': {
    title: 'Availability Settings — Andaaz Management Demo',
    description: 'Configure advisory dining slots, capacities, closures, and approval rules.',
  },
  '/staff-demo/settings': {
    title: 'Automation Settings — Andaaz Management Demo',
    description: 'Inspect n8n webhooks, Supabase persistence status, and endpoint integration contracts.',
  },
  '/automation-demo': {
    title: 'Client Automation Demo Centre — Andaaz Restaurant',
    description: 'Interactive demonstration of the n8n WhatsApp AI Reservation Agent for Andaaz Restaurant.',
  },
};
