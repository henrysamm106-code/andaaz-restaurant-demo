import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, ChevronDown } from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { Picture } from '../components/Picture';
import { GalleryLightbox } from '../components/GalleryLightbox';
import { MenuPageLightbox } from '../components/MenuPageLightbox';
import { RESTAURANT, FAQ_ITEMS } from '../data/restaurant';
import { FULL_MENU_SECTIONS, OFFICIAL_MENU_PAGES } from '../data/menu';
import { EXPERIENCES } from '../data/experiences';
import { GALLERY_SCENES } from '../data/assets';
import { useReservationDraft } from '../context/ReservationContext';
import { getKarachiToday } from '../lib/karachiTime';
import { IMAGE_CLIP_REVEAL, PAGE_TRANSITION, SECTION_REVEAL } from '../lib/motion';

export function HomePage() {
  const { draft, updateDraft } = useReservationDraft();
  const { navigate } = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const experienceTrackRef = useRef<HTMLDivElement | null>(null);
  const [floatPaused, setFloatPaused] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [menuLightboxIndex, setMenuLightboxIndex] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [guestInput, setGuestInput] = useState<string>(String(draft.guests));

  useEffect(() => {
    setGuestInput(String(draft.guests));
  }, [draft.guests]);

  const previewScenes = GALLERY_SCENES.slice(0, 6);
  const minDate = getKarachiToday();

  const scrollExperiences = (direction: 'prev' | 'next') => {
    const el = experienceTrackRef.current;
    if (!el) return;
    const step = Math.min(420, el.clientWidth * 0.8);
    el.scrollBy({ left: direction === 'next' ? step : -step, behavior: 'smooth' });
  };

  const handleTeaserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/reservations');
  };

  return (
    <motion.div {...PAGE_TRANSITION}>
      {/* 1. Asymmetric Photo-and-Type Hero */}
      <section className="relative min-h-[78vh] lg:min-h-[84vh] flex items-end lg:items-center bg-[#172332] text-[#FAF8F3] overflow-hidden">
        <div className="absolute inset-0">
          <Picture
            assetId="rooftop-table-landscape"
            portraitAssetId="rooftop-table-portrait"
            priority
            className="h-full w-full"
            imgClassName="h-full w-full object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#172332]/90 via-[#172332]/55 to-[#172332]/30 lg:bg-gradient-to-r lg:from-[#172332]/90 lg:via-[#172332]/65 lg:to-[#172332]/20"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1280px] w-full px-4 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs sm:text-sm tracking-[0.18em] uppercase text-[#FAF8F3]/80">
                Fort Road · Walled City of Lahore · Since {RESTAURANT.servingSince}
              </p>
              <h1 className="font-serif text-[42px] sm:text-[56px] lg:text-[78px] font-medium leading-[1.03] tracking-tight text-balance">
                An evening above Old Lahore.
              </h1>
              <p className="text-base sm:text-lg text-[#FAF8F3]/85 leading-relaxed max-w-xl">
                Pakistani and Lahori dining served across four floors opposite Badshahi Masjid, pairing rooftop vistas with composed indoor hospitality.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/reservations"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-6 py-3.5 text-sm font-medium transition-colors shadow-sm"
                >
                  Request a Table <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#FAF8F3]/40 bg-[#172332]/50 hover:bg-[#FAF8F3]/15 text-[#FAF8F3] px-6 py-3.5 text-sm font-medium transition-colors"
                >
                  Explore the Menu
                </Link>
              </div>
            </div>

            {/* Restrained floating invitation card */}
            <div className="lg:col-span-5 lg:flex lg:justify-end">
              <div className="w-full max-w-sm rounded-2xl bg-[#FAF8F3]/95 text-[#172332] p-6 sm:p-7 shadow-xl border border-[#172332]/10">
                <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
                  Invitation to Dine
                </p>
                <h2 className="font-serif text-2xl font-medium mt-1.5 text-[#172332]">
                  {RESTAURANT.landmark}
                </h2>
                <p className="mt-2 text-sm text-[#4F5D6A] leading-relaxed">
                  {RESTAURANT.shortAddress}. Dinner requests are taken for 5:00 PM through 10:00 PM, subject to confirmation.
                </p>
                <div className="mt-4 pt-4 border-t border-[#172332]/10 flex items-center justify-between text-xs text-[#4F5D6A]">
                  <span>Rooftop & Indoor Dining</span>
                  <Link
                    to="/contact"
                    className="font-medium text-[#7E4D54] hover:underline underline-offset-4"
                  >
                    Directions & Phone
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Compact Reservation Teaser */}
      <section aria-label="Quick reservation request" className="bg-[#F2EDE3] border-b border-[#172332]/10">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-6">
          <form
            onSubmit={handleTeaserSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end"
          >
            <div className="lg:col-span-3">
              <label htmlFor="teaser-mode" className="block text-xs font-medium text-[#4F5D6A] mb-1.5">
                Visit Type
              </label>
              <select
                id="teaser-mode"
                value={draft.mode}
                onChange={(e) =>
                  updateDraft({
                    mode: e.target.value === 'occasion' ? 'occasion' : 'dinner',
                  })
                }
                className="w-full rounded-xl border border-[#172332]/15 bg-[#FAF8F3] px-3.5 py-2.5 text-sm text-[#172332] min-h-[44px]"
              >
                <option value="dinner">Ordinary Dinner</option>
                <option value="occasion">Hosted Occasion / Event</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label htmlFor="teaser-date" className="block text-xs font-medium text-[#4F5D6A] mb-1.5">
                Preferred Date (Pakistan Time)
              </label>
              <input
                id="teaser-date"
                type="date"
                min={minDate}
                value={draft.date}
                onChange={(e) => {
                  if (e.target.value) updateDraft({ date: e.target.value });
                }}
                className="w-full rounded-xl border border-[#172332]/15 bg-[#FAF8F3] px-3.5 py-2.5 text-sm text-[#172332] tabular-nums min-h-[44px]"
              />
            </div>

            <div className="lg:col-span-3">
              <label htmlFor="teaser-guests" className="block text-xs font-medium text-[#4F5D6A] mb-1.5">
                Party Size
              </label>
              <input
                id="teaser-guests"
                type="number"
                min={1}
                step={1}
                value={guestInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setGuestInput(val);
                  const n = parseInt(val, 10);
                  if (!Number.isNaN(n) && n >= 1) updateDraft({ guests: n });
                }}
                onBlur={() => {
                  const n = parseInt(guestInput, 10);
                  const valid = !Number.isNaN(n) && n >= 1 ? n : 1;
                  updateDraft({ guests: valid });
                  setGuestInput(String(valid));
                }}
                className="w-full rounded-xl border border-[#172332]/15 bg-[#FAF8F3] px-3.5 py-2.5 text-sm text-[#172332] tabular-nums min-h-[44px]"
              />
            </div>

            <div className="lg:col-span-3">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-2.5 text-sm font-medium transition-colors min-h-[44px]"
              >
                Continue Request <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 3. The House: Overlapping Portrait/Landscape Composition */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <motion.div {...SECTION_REVEAL} className="lg:col-span-5 space-y-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
              The House on Fort Road
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.08] text-[#172332] text-balance">
              Four floors overlooking Shahi Mohallah.
            </h2>
            <p className="text-base text-[#4F5D6A] leading-relaxed">
              Occupying a heritage house facing Badshahi Masjid, Andaaz welcomes guests across enclosed dining salons and open-air rooftop terraces. Each level offers a distinct perspective on the Walled City as evening settles over Lahore.
            </p>
            <div className="pt-2">
              <Link
                to="/our-story"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#7E4D54] hover:text-[#693E45] group"
              >
                <span className="border-b border-[#7E4D54]/40 pb-0.5 group-hover:border-[#7E4D54]">
                  Read the story of The House
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          <div className="lg:col-span-7 relative">
            <motion.div {...IMAGE_CLIP_REVEAL} className="lg:pr-16">
              <Picture
                assetId="dining-room-landscape"
                aspectClassName="aspect-[3/2] rounded-2xl shadow-md"
              />
            </motion.div>
            <motion.div
              {...IMAGE_CLIP_REVEAL}
              className="mt-6 sm:mt-0 sm:w-56 lg:w-64 sm:absolute sm:-bottom-10 sm:right-0 rounded-2xl overflow-hidden shadow-xl border-4 border-[#FAF8F3]"
            >
              <Picture
                assetId="house-interior-detail"
                aspectClassName="aspect-[4/5]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. The Kitchen: Original Menu Sheets + Full Six-Course Preview */}
      <section className="bg-[#F2EDE3]/70 border-y border-[#172332]/10 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <motion.div {...SECTION_REVEAL} className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
                  The Kitchen · Fort Road, Lahore
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.08] text-[#172332] text-balance">
                  Fort Road, Lahore — Six courses from our kitchen.
                </h2>
                <p className="text-sm sm:text-base text-[#4F5D6A] leading-relaxed">
                  Prepared to order at our sole Fort Road heritage house opposite Badshahi Masjid across Tandoori Namonay, Karahi Kay Kamal, accompaniments, sweets, and house teas.
                </p>
              </div>

              <div className="rounded-2xl bg-[#172332] text-[#FAF8F3] p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#AA7C7E]">
                      Original Printed Menu · Fort Road, Lahore
                    </p>
                    <h3 className="font-serif text-2xl font-medium mt-1">
                      Inspect the Three Sheets
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {OFFICIAL_MENU_PAGES.map((page, idx) => (
                    <button
                      key={page.pageNumber}
                      type="button"
                      onClick={() => setMenuLightboxIndex(idx)}
                      className="group text-left rounded-xl overflow-hidden border border-[#FAF8F3]/15 bg-[#1F2B38] hover:border-[#AA7C7E] transition-colors focus-visible:outline-2 focus-visible:outline-[#FAF8F3]"
                    >
                      <div className="aspect-[3/4] overflow-hidden bg-[#FAF8F3]">
                        <img
                          src={page.localPath}
                          alt={page.alt}
                          className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
                        />
                      </div>
                      <p className="px-2.5 py-2 text-[11px] font-medium text-[#FAF8F3]/85 tabular-nums truncate">
                        Sheet 0{page.pageNumber}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Link
                    to="/menu"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-3 text-sm font-medium transition-colors"
                  >
                    Explore Complete Menu <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 pt-2">
              {FULL_MENU_SECTIONS.map((section, idx) => (
                <div
                  key={section.id}
                  className="border-t border-[#172332]/15 pt-5"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-serif text-2xl sm:text-[26px] font-medium text-[#172332]">
                      <Link to={`/menu#${section.id}`} className="hover:text-[#7E4D54] transition-colors">
                        {section.name}
                      </Link>
                    </h3>
                    <span className="text-xs text-[#7E4D54] tabular-nums shrink-0">
                      0{idx + 1} · {section.items.length} items
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#4F5D6A] line-clamp-2">{section.subtitle}</p>
                  <ul className="mt-4 space-y-1.5 text-sm sm:text-base text-[#172332]">
                    {section.items.slice(0, 4).map((item) => (
                      <li
                        key={item.name}
                        className="py-1 border-b border-[#172332]/8 last:border-b-0 flex items-baseline justify-between gap-3"
                      >
                        <span>{item.name}</span>
                        <span className="text-xs text-[#4F5D6A] tabular-nums">
                          {item.printedPrice.toLocaleString('en-US')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Flowing Experience Track */}
      <section className="py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
                Private & Hosted Occasions
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#172332] text-balance">
                Gatherings shaped to the evening.
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setFloatPaused((p) => !p)}
                aria-label={floatPaused ? 'Resume gentle card motion' : 'Pause gentle card motion'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#172332]/15 px-3 py-2 text-xs font-medium text-[#4F5D6A] hover:text-[#172332] min-h-[40px]"
              >
                {floatPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                <span>{floatPaused ? 'Play motion' : 'Pause motion'}</span>
              </button>
              <button
                type="button"
                onClick={() => scrollExperiences('prev')}
                aria-label="Scroll experiences left"
                className="hidden sm:inline-flex items-center justify-center h-10 w-10 rounded-xl border border-[#172332]/15 text-[#172332] hover:bg-[#F2EDE3] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollExperiences('next')}
                aria-label="Scroll experiences right"
                className="hidden sm:inline-flex items-center justify-center h-10 w-10 rounded-xl border border-[#172332]/15 text-[#172332] hover:bg-[#F2EDE3] transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={experienceTrackRef}
            className="flex gap-6 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory"
          >
            {EXPERIENCES.map((exp, idx) => {
              const shouldFloat =
                !prefersReducedMotion &&
                !floatPaused &&
                hoveredSlug !== exp.slug &&
                (idx === 1 || idx === 4);
              return (
                <motion.article
                  key={exp.slug}
                  onMouseEnter={() => setHoveredSlug(exp.slug)}
                  onMouseLeave={() => setHoveredSlug(null)}
                  onFocus={() => setHoveredSlug(exp.slug)}
                  onBlur={() => setHoveredSlug(null)}
                  animate={
                    shouldFloat
                      ? { y: [0, -5, 0] }
                      : { y: 0 }
                  }
                  transition={
                    shouldFloat
                      ? { duration: 7, repeat: Infinity, ease: 'easeInOut' }
                      : undefined
                  }
                  whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                  className="snap-start shrink-0 w-[82vw] sm:w-[340px] lg:w-[370px] rounded-2xl bg-[#FAF8F3] border border-[#172332]/10 overflow-hidden flex flex-col justify-between group transition-shadow hover:shadow-lg"
                >
                  <div>
                    <Link to={exp.route} className="block overflow-hidden">
                      <Picture
                        assetId={exp.heroAssetId}
                        aspectClassName="aspect-[4/3]"
                        imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </Link>
                    <div className="p-6 space-y-2.5">
                      <p className="text-xs text-[#7E4D54] font-medium">{exp.kicker}</p>
                      <h3 className="font-serif text-2xl font-medium text-[#172332]">
                        <Link to={exp.route} className="hover:text-[#7E4D54] transition-colors">
                          {exp.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-[#4F5D6A] leading-relaxed">
                        {exp.shortDescription}
                      </p>
                    </div>
                  </div>
                  <div className="px-6 pb-6 pt-2">
                    <Link
                      to={exp.route}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7E4D54] hover:underline underline-offset-4"
                    >
                      Explore {exp.title} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <div className="mt-6">
            <Link
              to="/experiences"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#172332] hover:text-[#7E4D54]"
            >
              View all hosted experiences <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Navy Evening Feature */}
      <section className="bg-[#172332] text-[#FAF8F3] py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <motion.div {...IMAGE_CLIP_REVEAL} className="lg:col-span-7">
              <Picture
                assetId="mosque-night-landscape"
                portraitAssetId="mosque-night-portrait"
                aspectClassName="aspect-[16/9] rounded-2xl shadow-2xl"
              />
            </motion.div>

            <motion.div {...SECTION_REVEAL} className="lg:col-span-5 space-y-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#AA7C7E]">
                After Dusk on Fort Road
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.08] text-balance">
                When the minarets illuminate at night.
              </h2>
              <p className="text-base text-[#FAF8F3]/80 leading-relaxed">
                From the terrace above Shahi Mohallah, dinner unfolds beside the lit arches and marble domes of Badshahi Masjid. Open-air rooftop and indoor seating preferences are welcomed when submitting your request.
              </p>
              <div className="pt-2 flex flex-wrap gap-3.5">
                <Link
                  to="/reservations"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-3 text-sm font-medium transition-colors"
                >
                  Request an Evening Table <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. Gallery Preview */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-28">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2.5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
              Atmosphere & Spaces
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#172332]">
              Inside & above the Walled City.
            </h2>
          </div>
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#7E4D54] hover:underline underline-offset-4 shrink-0"
          >
            Open Full Gallery ({GALLERY_SCENES.length} scenes) <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {previewScenes.map((scene, idx) => (
            <button
              key={scene.sceneGroup}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className="group text-left rounded-2xl overflow-hidden border border-[#172332]/10 bg-[#FAF8F3] transition-transform duration-200 hover:-translate-y-1"
            >
              <Picture
                assetId={scene.landscapeId}
                portraitAssetId={scene.portraitId}
                aspectClassName="aspect-[4/3]"
                imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="p-4 sm:p-5">
                <p className="text-xs text-[#7E4D54]">{scene.category}</p>
                <p className="font-serif text-xl font-medium text-[#172332] mt-0.5">
                  {scene.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 8. Reservation FAQ & Final Invitation */}
      <section className="bg-[#F2EDE3] border-t border-[#172332]/10 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
                Before You Request
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#172332] text-balance">
                Clear guidance for your visit.
              </h2>
              <p className="text-sm sm:text-base text-[#4F5D6A] leading-relaxed">
                Dinner is by reservation request, and all enquiries are confirmed directly by the restaurant team at {RESTAURANT.phoneDisplay}.
              </p>
              <div className="pt-3 flex flex-wrap gap-3">
                <Link
                  to="/reservations"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-3 text-sm font-medium transition-colors"
                >
                  Begin Reservation Request <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 divide-y divide-[#172332]/12 border-y border-[#172332]/12">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.question} className="py-4">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-4 text-left py-1.5 min-h-[44px]"
                    >
                      <span className="font-serif text-xl font-medium text-[#172332]">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-[#4F5D6A] shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="pt-2 pb-2 text-sm sm:text-base text-[#4F5D6A] leading-relaxed">
                        {item.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <GalleryLightbox
        scenes={previewScenes}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />
      <MenuPageLightbox
        activePageIndex={menuLightboxIndex}
        onClose={() => setMenuLightboxIndex(null)}
        onChangePageIndex={setMenuLightboxIndex}
      />
    </motion.div>
  );
}
