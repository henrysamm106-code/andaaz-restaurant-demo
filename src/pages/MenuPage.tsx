import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Search,
  ExternalLink,
  ArrowRight,
  ZoomIn,
  BookOpen,
} from 'lucide-react';
import { Link } from '../lib/router';
import {
  FULL_MENU_SECTIONS,
  MENU_META,
  OFFICIAL_MENU_PAGES,
} from '../data/menu';
import { OFFICIAL_BRANCHES, RESTAURANT } from '../data/restaurant';
import { PAGE_TRANSITION } from '../lib/motion';
import { MenuPageLightbox } from '../components/MenuPageLightbox';
import { Picture } from '../components/Picture';
import { GALLERY_SCENES } from '../data/assets';

export function MenuPage() {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lightboxPageIndex, setLightboxPageIndex] = useState<number | null>(null);

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FULL_MENU_SECTIONS.filter(
      (sec) => selectedSectionId === 'all' || sec.id === selectedSectionId
    )
      .map((sec) => ({
        ...sec,
        items: q
          ? sec.items.filter(
              (item) =>
                item.name.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                sec.name.toLowerCase().includes(q) ||
                sec.englishLabel.toLowerCase().includes(q)
            )
          : sec.items,
      }))
      .filter((sec) => sec.items.length > 0);
  }, [selectedSectionId, searchQuery]);

  const totalMatchingDishes = useMemo(
    () => filteredSections.reduce((sum, sec) => sum + sec.items.length, 0),
    [filteredSections]
  );

  return (
    <motion.div {...PAGE_TRANSITION}>
      {/* Editorial Header */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
              Fort Road, Walled City of Lahore · Sole Flagship House
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] text-[#172332]">
              Andaaz Menu — Fort Road, Lahore
            </h1>
            <p className="text-base text-[#4F5D6A] leading-relaxed max-w-2xl">
              {MENU_META.scopeNote} {RESTAURANT.singleLocationNote}
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col items-start lg:items-end gap-3">
            <div className="flex flex-wrap gap-3">
              <Link
                to="/reservations"
                className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap"
              >
                Request a Table <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={RESTAURANT.localMenuPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[#172332]/20 bg-white hover:bg-[#F2EDE3] text-[#172332] px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
              >
                <FileText className="h-4 w-4" />
                Official Menu PDF
              </a>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#4F5D6A]">
              <button
                type="button"
                onClick={() => setLightboxPageIndex(0)}
                className="inline-flex items-center gap-1 hover:text-[#7E4D54] underline underline-offset-4"
              >
                <BookOpen className="h-3.5 w-3.5" /> Inspect Original Sheets (3 Pages)
              </button>
              <a
                href={RESTAURANT.officialMenuPage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-[#7E4D54] underline underline-offset-4"
              >
                Official Menu Page <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Original Three Printed Menu Pages Visual Showcase */}
      <section
        id="original-menu-pages"
        aria-label="Original Printed Menu Pages"
        className="bg-[#F2EDE3]/70 border-y border-[#172332]/10 py-10 sm:py-12"
      >
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
                Original Menu Photos · Fort Road, Lahore
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#172332] mt-1">
                Printed Menu Sheets — Fort Road, Lahore House
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4F5D6A]">
              Select any sheet below to enlarge and read the original printed artwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {OFFICIAL_MENU_PAGES.map((page, idx) => (
              <button
                key={page.pageNumber}
                type="button"
                onClick={() => setLightboxPageIndex(idx)}
                className="group text-left rounded-2xl bg-[#FAF8F3] border border-[#172332]/12 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-[#7E4D54]"
              >
                <div className="relative aspect-[3/4] bg-[#EFE9DD] overflow-hidden border-b border-[#172332]/10">
                  <img
                    src={page.localPath}
                    alt={page.alt}
                    loading="eager"
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#172332]/65 to-transparent flex items-end justify-end p-3.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FAF8F3] text-[#172332] px-3 py-1.5 text-xs font-medium shadow-sm">
                      <ZoomIn className="h-3.5 w-3.5 text-[#7E4D54]" />
                      Inspect Page {page.pageNumber}
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-xs text-[#7E4D54] font-medium tracking-wide uppercase tabular-nums">
                    Sheet 0{page.pageNumber}
                  </p>
                  <p className="font-serif text-xl font-medium text-[#172332] mt-0.5">
                    {page.sectionsLabel}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Complete Interactive HTML Menu */}
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 space-y-10">
          {/* Course Filter & Search Controls */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div
                className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
                role="tablist"
                aria-label="Menu courses"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedSectionId === 'all'}
                  onClick={() => setSelectedSectionId('all')}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors min-h-[40px] whitespace-nowrap shrink-0 ${
                    selectedSectionId === 'all'
                      ? 'bg-[#172332] text-[#FAF8F3]'
                      : 'bg-[#F2EDE3] text-[#172332] border border-[#172332]/12 hover:bg-white'
                  }`}
                >
                  All Courses
                </button>
                {FULL_MENU_SECTIONS.map((sec) => {
                  const active = selectedSectionId === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors min-h-[40px] whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#172332] text-[#FAF8F3]'
                          : 'bg-[#F2EDE3] text-[#172332] border border-[#172332]/12 hover:bg-white'
                      }`}
                    >
                      {sec.name}
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full lg:w-80 shrink-0">
                <Search className="h-4 w-4 text-[#4F5D6A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <label htmlFor="menu-search" className="sr-only">
                  Search dishes, descriptions, or spices
                </label>
                <input
                  id="menu-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes, ingredients, chai…"
                  className="w-full rounded-xl border border-[#172332]/15 bg-[#FAF8F3] pl-10 pr-4 py-2.5 text-sm text-[#172332] placeholder:text-[#4F5D6A]/70 min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4F5D6A] border-b border-[#172332]/10 pb-3">
              <span className="tabular-nums">
                Showing {totalMatchingDishes} {totalMatchingDishes === 1 ? 'selection' : 'selections'} across{' '}
                {filteredSections.length} {filteredSections.length === 1 ? 'course' : 'courses'}
              </span>
              <span>Printed sheet figures shown without unprinted currency/taxes — confirm live prices with Andaaz</span>
            </div>
          </div>

          {filteredSections.length === 0 ? (
            <div className="rounded-2xl bg-[#F2EDE3]/60 border border-[#172332]/10 p-10 text-center space-y-3">
              <p className="font-serif text-2xl text-[#172332]">No matching dishes found</p>
              <p className="text-sm text-[#4F5D6A] max-w-md mx-auto">
                Try clearing your search or inspect the original printed menu pages directly.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSectionId('all');
                  }}
                  className="rounded-xl border border-[#172332]/20 bg-[#FAF8F3] px-4 py-2.5 text-sm font-medium text-[#172332]"
                >
                  Show All Courses
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxPageIndex(0)}
                  className="rounded-xl bg-[#7E4D54] text-[#FAF8F3] px-4 py-2.5 text-sm font-medium"
                >
                  Inspect Original Pages
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredSections.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 rounded-2xl bg-[#FAF8F3] border border-[#172332]/12 shadow-xs overflow-hidden"
                >
                  {/* Section Header */}
                  <div className="bg-[#F2EDE3]/75 border-b border-[#172332]/10 px-6 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium tabular-nums">
                        Fort Road, Lahore · Sheet 0{section.pageNumber} · {section.englishLabel}
                      </p>
                      <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#172332] mt-1">
                        {section.name}
                      </h2>
                      <p className="text-sm text-[#4F5D6A] mt-1.5 max-w-2xl">
                        {section.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLightboxPageIndex(section.pageNumber - 1)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#172332]/15 bg-[#FAF8F3] hover:bg-white text-[#172332] px-3.5 py-2 text-xs font-medium transition-colors self-start sm:self-auto whitespace-nowrap shrink-0 min-h-[38px]"
                    >
                      <ZoomIn className="h-3.5 w-3.5 text-[#7E4D54]" />
                      View Original Sheet 0{section.pageNumber}
                    </button>
                  </div>

                  {/* Two-Column Editorial Dish List */}
                  <div className="px-6 sm:px-8 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-1">
                      {section.items.map((dish) => (
                        <div
                          key={dish.name}
                          className="py-4 border-b border-[#172332]/8 flex flex-col justify-between"
                        >
                          <div className="flex items-baseline justify-between gap-4">
                            <h3 className="font-serif text-xl sm:text-[22px] font-medium text-[#172332] leading-snug">
                              {dish.name}
                            </h3>
                            <span
                              aria-label={`Printed menu figure ${dish.printedPrice}`}
                              className="font-sans text-sm sm:text-base font-medium text-[#172332] tabular-nums shrink-0"
                            >
                              {dish.printedPrice.toLocaleString('en-US')}
                            </span>
                          </div>
                          <p className="text-sm text-[#4F5D6A] leading-relaxed mt-1 pr-8">
                            {dish.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    {section.spiceNote && (
                      <p className="mt-5 pt-4 border-t border-[#172332]/10 text-xs italic text-[#4F5D6A]">
                        {section.spiceNote}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Verified Location & Dining Spaces Photos */}
          <div className="rounded-2xl bg-[#F2EDE3]/70 border border-[#172332]/12 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
                  Location Photography · Single Heritage House
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#172332] mt-1">
                  {OFFICIAL_BRANCHES[0].name}
                </h2>
                <p className="text-sm text-[#4F5D6A] mt-1 max-w-2xl">
                  {OFFICIAL_BRANCHES[0].address} ({OFFICIAL_BRANCHES[0].landmark}) · Tel &amp; WhatsApp:{' '}
                  <a
                    href={`tel:${OFFICIAL_BRANCHES[0].phoneE164}`}
                    className="font-medium text-[#7E4D54] hover:underline"
                  >
                    {OFFICIAL_BRANCHES[0].phoneDisplay}
                  </a>
                </p>
              </div>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7E4D54] hover:underline underline-offset-4 shrink-0"
              >
                View All {GALLERY_SCENES.length} Fort Road Photos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {OFFICIAL_BRANCHES[0].photoIds.map((assetId) => {
                const scene = GALLERY_SCENES.find((s) => s.landscapeId === assetId);
                return (
                  <Link
                    key={assetId}
                    to="/gallery"
                    className="group rounded-xl overflow-hidden border border-[#172332]/10 bg-[#FAF8F3] transition-transform hover:-translate-y-0.5"
                  >
                    <Picture
                      assetId={assetId}
                      aspectClassName="aspect-[4/3]"
                      imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="p-3">
                      <p className="text-[11px] uppercase tracking-wider text-[#7E4D54]">
                        {scene?.category ?? 'Fort Road, Lahore'}
                      </p>
                      <p className="font-serif text-base font-medium text-[#172332] mt-0.5 line-clamp-1">
                        {scene?.title ?? 'Fort Road Dining Space'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Grounded Footer Disclaimer & Reservation CTA */}
          <div className="rounded-2xl bg-[#172332] text-[#FAF8F3] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.16em] text-[#AA7C7E]">
                Pricing &amp; Dietary Guidance · Fort Road, Lahore
              </p>
              <p className="text-sm text-[#FAF8F3]/85 leading-relaxed">
                {MENU_META.priceNote} Reach the restaurant team directly at{' '}
                <a
                  href={`tel:${RESTAURANT.phoneE164}`}
                  className="text-[#FAF8F3] font-medium underline underline-offset-4 hover:text-[#AA7C7E]"
                >
                  {RESTAURANT.phoneDisplay}
                </a>
                .
              </p>
            </div>

            <Link
              to="/reservations"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-3 text-sm font-medium transition-colors shrink-0 self-start md:self-auto whitespace-nowrap"
            >
              Request a Table <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <MenuPageLightbox
        activePageIndex={lightboxPageIndex}
        onClose={() => setLightboxPageIndex(null)}
        onChangePageIndex={setLightboxPageIndex}
      />
    </motion.div>
  );
}
