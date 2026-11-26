export type ExperienceSlug =
  | 'private-brunch'
  | 'corporate-hosting'
  | 'dinner-with-music'
  | 'celebrations'
  | 'wedding-gatherings'
  | 'anniversary-dinner';

export interface ExperienceItem {
  slug: ExperienceSlug;
  route: `/experiences/${ExperienceSlug}`;
  officialSource: string;
  title: string;
  subtitle: string;
  kicker: string;
  shortDescription: string;
  narrative: string[];
  planningNotes: string[];
  heroAssetId: string;
  secondaryAssetIds: string[];
  recommendedSeating: 'rooftop' | 'indoor' | 'no-preference';
  ctaLabel: string;
  isCustomTimeExperience: boolean;
}

export const EXPERIENCES: ExperienceItem[] = [
  {
    slug: 'private-brunch',
    route: '/experiences/private-brunch',
    officialSource: 'https://andaazrestaurant.com/breakfast-brunch',
    title: 'Private Brunch',
    subtitle: 'Daylight gatherings above Fort Road by prior arrangement',
    kicker: 'Planned Daytime Enquiry',
    shortDescription:
      'Morning and midday terrace or glass-room gatherings overlooking Badshahi Masjid, arranged strictly as planned private enquiries.',
    narrative: [
      'In the softer morning light of the Walled City, the upper terrace and glass-sided dining room offer a calm vantage point opposite Badshahi Masjid before the evening rush begins.',
      'Private brunch at Andaaz is arranged as a planned group enquiry rather than an everyday walk-in morning schedule. Share your preferred date, daytime arrival window, and party size so the team can advise on possibilities.',
    ],
    planningNotes: [
      'Private brunch is a planned enquiry and not a promise of daily morning service.',
      'Specify your preferred morning or midday arrival window directly in the request.',
      'Menu selection, timing, and seating floor are confirmed by the restaurant team.',
    ],
    heroAssetId: 'breakfast-brunch-1',
    secondaryAssetIds: ['breakfast-brunch-4', 'breakfast-brunch-7'],
    recommendedSeating: 'rooftop',
    ctaLabel: 'Enquire About Private Brunch',
    isCustomTimeExperience: true,
  },
  {
    slug: 'corporate-hosting',
    route: '/experiences/corporate-hosting',
    officialSource: 'https://andaazrestaurant.com/corporate-hosting',
    title: 'Corporate Hosting',
    subtitle: 'Delegations, executive dinners, and hosted evenings across four floors',
    kicker: 'Up to 200 Guests Across Spaces',
    shortDescription:
      'Host visiting delegations, leadership dinners, and institutional receptions across indoor salons and rooftop terraces.',
    narrative: [
      'Overlooking one of Lahore’s most iconic landmarks, Andaaz provides a composed setting for corporate guests, diplomatic visitors, and company milestones.',
      'Across its four floors and combination of indoor salons and open-air terraces, the restaurant advertises capacity for up to 200 guests. Every corporate gathering is tailored and remains subject to event-specific confirmation.',
    ],
    planningNotes: [
      'Capacity of up to 200 guests is advertised across floors and dining spaces; event-specific capacity requires staff confirmation.',
      'Indoor private dining salons or coordinated rooftop sections can be requested.',
      'Discuss menu pacing, seating layout, and arrival timing directly with the team.',
    ],
    heroAssetId: 'corporate-hosting-1',
    secondaryAssetIds: ['corporate-hosting-4', 'corporate-hosting-7'],
    recommendedSeating: 'indoor',
    ctaLabel: 'Enquire About Corporate Hosting',
    isCustomTimeExperience: true,
  },
  {
    slug: 'dinner-with-music',
    route: '/experiences/dinner-with-music',
    officialSource: 'https://andaazrestaurant.com/dinner-with-music',
    title: 'Dinner with Music',
    subtitle: 'Acoustic instrumental accompaniment arranged for special evenings',
    kicker: 'Musical Arrangement by Enquiry',
    shortDescription:
      'Discuss live acoustic accompaniment—such as violin or accordion—for a hosted evening overlooking Badshahi Masjid.',
    narrative: [
      'When the minarets of Badshahi Masjid are lit after dusk, acoustic music brings an intimate cadence to a hosted dinner without overwhelming conversation.',
      'Live music at Andaaz is an arrangement to discuss in advance with the restaurant team rather than a guaranteed nightly performance. Share your date and occasion so the team can confirm what can be arranged.',
    ],
    planningNotes: [
      'Live music is an arrangement to discuss with the team, not a guaranteed nightly show.',
      'Specify your preferred evening date, arrival time, and guest count when enquiring.',
      'Confirmation of musicians and terrace placement rests with the restaurant.',
    ],
    heroAssetId: 'dinner-with-music-1',
    secondaryAssetIds: ['dinner-with-music-4', 'dinner-with-music-7'],
    recommendedSeating: 'rooftop',
    ctaLabel: 'Enquire About Dinner with Music',
    isCustomTimeExperience: false,
  },
  {
    slug: 'celebrations',
    route: '/experiences/celebrations',
    officialSource: 'https://andaazrestaurant.com/shining-moments',
    title: 'Celebrations',
    subtitle: 'Birthdays, family milestones, and evenings worth gathering for',
    kicker: 'Family & Milestone Gatherings',
    shortDescription:
      'Mark birthdays, graduations, and cherished family reunions with candlelit hospitality high above Shahi Mohallah.',
    narrative: [
      'From small family tables to lively multi-generational celebrations around candlelight, Andaaz offers a setting that feels rooted in Lahore’s hospitality.',
      'Share the occasion and any special requests—such as a celebratory cake or group seating preference—so the team can prepare a thoughtful welcome subject to availability.',
    ],
    planningNotes: [
      'Suitable for intimate birthday tables as well as larger family group gatherings.',
      'Include notes on celebratory touches or seating preferences in Step 2 of the request.',
      'All arrangements remain subject to confirmation by the restaurant.',
    ],
    heroAssetId: 'shining-moments-7',
    secondaryAssetIds: ['shining-moments-1', 'shining-moments-4'],
    recommendedSeating: 'rooftop',
    ctaLabel: 'Enquire About a Celebration',
    isCustomTimeExperience: false,
  },
  {
    slug: 'wedding-gatherings',
    route: '/experiences/wedding-gatherings',
    officialSource: 'https://andaazrestaurant.com/wedding-gatherings',
    title: 'Wedding Gatherings',
    subtitle: 'Intimate dholkis, welcome dinners, and family wedding feasts',
    kicker: 'Bespoke Wedding Hospitality',
    shortDescription:
      'Host pre-wedding dinners, visiting family receptions, and dressed terrace gatherings overlooking the Walled City.',
    narrative: [
      'Whether welcoming out-of-town guests or hosting an intimate wedding-week dinner under draped canopies and warm lanterns, Andaaz brings Walled City character to family celebrations.',
      'Because wedding gatherings vary in size, decor, and timing, every detail is planned directly with the restaurant team through a dedicated enquiry.',
    ],
    planningNotes: [
      'Planned enquiry for wedding-week dinners, family receptions, and dressed terrace spaces.',
      'Share expected guest count, preferred date, and timing window for staff review.',
      'Decor, music, and floor allocation require direct restaurant confirmation.',
    ],
    heroAssetId: 'wedding-gatherings-1',
    secondaryAssetIds: ['wedding-gatherings-4', 'wedding-gatherings-7'],
    recommendedSeating: 'rooftop',
    ctaLabel: 'Enquire About Wedding Gatherings',
    isCustomTimeExperience: true,
  },
  {
    slug: 'anniversary-dinner',
    route: '/experiences/anniversary-dinner',
    officialSource: 'https://andaazrestaurant.com/anniversary-dinner-lahore',
    title: 'Anniversary Dinner',
    subtitle: 'Quiet evening tables framed by the illuminated skyline of Old Lahore',
    kicker: 'Intimate Evening Dining',
    shortDescription:
      'Request an unhurried table for two or a close family anniversary dinner facing the evening glow of Badshahi Masjid.',
    narrative: [
      'An anniversary evening at Andaaz pairs unhurried Pakistani dining with one of the most memorable views in Lahore.',
      'Request a rooftop preference for open-air night views or an indoor table overlooking the courtyard, and note your occasion so the team can take care of the details.',
    ],
    planningNotes: [
      'Standard dinner arrival slots (5:00 PM – 10:00 PM) or custom group timing can be noted.',
      'Rooftop or indoor seating is requested as a preference, subject to confirmation.',
      'Mention your anniversary in the notes so the team is aware ahead of your arrival.',
    ],
    heroAssetId: 'anniversary-dinner-lahore-9',
    secondaryAssetIds: ['anniversary-dinner-lahore-1', 'anniversary-dinner-lahore-3'],
    recommendedSeating: 'rooftop',
    ctaLabel: 'Request an Anniversary Table',
    isCustomTimeExperience: false,
  },
];

export function getExperienceBySlug(slug: string): ExperienceItem | undefined {
  return EXPERIENCES.find((exp) => exp.slug === slug);
}
