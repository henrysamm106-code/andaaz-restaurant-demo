import React, { useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { Menu, X, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { RESTAURANT } from '../data/restaurant';
import { ASSETS } from '../data/assets';

const NAV_ITEMS = [
  { label: 'The House', to: '/our-story' },
  { label: 'Menu', to: '/menu' },
  { label: 'Experiences', to: '/experiences' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact', to: '/contact' },
];

export function Layout({
  children,
  assistantSlot,
}: {
  children: React.ReactNode;
  assistantSlot?: React.ReactNode;
}) {
  const { pathname } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);
  const drawerCloseRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      wasOpenRef.current = true;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        drawerCloseRef.current?.focus();
      });
    } else {
      document.body.style.overflow = '';
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        menuToggleRef.current?.focus();
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const logo = ASSETS['logo-original'];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#FAF8F3] text-[#172332] overflow-x-clip">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-[#172332] focus:text-[#FAF8F3] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
        >
          Skip to main content
        </a>

        {/* Single-row 3-zone editorial header */}
        <header className="sticky top-0 z-40 bg-[#FAF8F3]/95 backdrop-blur-sm border-b border-[#172332]/10">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 h-18 sm:h-20 flex items-center justify-between gap-4 lg:gap-8">
            {/* Zone 1: Original Logo & Brand */}
            <Link
              to="/"
              className="flex items-center gap-3 shrink-0 group"
              aria-label="Andaaz Restaurant Home"
            >
              <img
                src={logo.localPath}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className="h-12 sm:h-14 w-auto object-contain rounded-[4px]"
              />
              <span className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#172332] whitespace-nowrap">
                Andaaz
              </span>
            </Link>

            {/* Zone 2: Concise Navigation */}
            <nav
              aria-label="Primary navigation"
              className="hidden md:flex items-center gap-6 lg:gap-8"
            >
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.to ||
                  (item.to === '/experiences' && pathname.startsWith('/experiences/'));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#7E4D54]'
                        : 'text-[#1F2B38] hover:text-[#7E4D54]'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-0.5 h-[1.5px] bg-[#7E4D54]"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Zone 3: Single Primary Action + Mobile Drawer Toggle */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/reservations"
                className="inline-flex items-center justify-center rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-3.5 sm:px-5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors shadow-xs"
              >
                Request a Table
              </Link>

              <button
                ref={menuToggleRef}
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-drawer"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="md:hidden inline-flex items-center justify-center h-11 w-11 rounded-xl border border-[#172332]/15 text-[#172332] hover:bg-[#172332]/5 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="fixed inset-0 z-50 md:hidden bg-[#172332]/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="ml-auto h-full w-full max-w-xs bg-[#FAF8F3] text-[#172332] p-6 flex flex-col justify-between shadow-2xl border-l border-[#172332]/10 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-[#172332]/10">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={logo.localPath}
                      alt={logo.alt}
                      width={logo.width}
                      height={logo.height}
                      className="h-10 w-auto object-contain"
                    />
                    <span className="font-serif text-xl font-semibold">Andaaz</span>
                  </div>
                  <button
                    ref={drawerCloseRef}
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close navigation menu"
                    className="h-11 w-11 inline-flex items-center justify-center rounded-xl border border-[#172332]/15 text-[#172332]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav aria-label="Mobile menu" className="mt-6 flex flex-col gap-1">
                  <Link
                    to="/"
                    className={`px-3 py-3 rounded-xl text-base font-medium transition-colors ${
                      pathname === '/' ? 'bg-[#172332]/5 text-[#7E4D54]' : 'text-[#1F2B38]'
                    }`}
                  >
                    Home
                  </Link>
                  {NAV_ITEMS.map((item) => {
                    const isActive =
                      pathname === item.to ||
                      (item.to === '/experiences' && pathname.startsWith('/experiences/'));
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`px-3 py-3 rounded-xl text-base font-medium transition-colors ${
                          isActive ? 'bg-[#172332]/5 text-[#7E4D54]' : 'text-[#1F2B38]'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-6 pt-6 border-t border-[#172332]/10">
                  <Link
                    to="/reservations"
                    className="w-full inline-flex items-center justify-center rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-3 text-sm font-medium transition-colors"
                  >
                    Request a Table
                  </Link>
                </div>
              </div>

              <div className="pt-6 border-t border-[#172332]/10 text-xs text-[#4F5D6A] space-y-2">
                <p className="font-medium text-[#172332]">{RESTAURANT.shortAddress}</p>
                <p>{RESTAURANT.landmark}</p>
                <a
                  href={`tel:${RESTAURANT.phoneE164}`}
                  className="inline-flex items-center gap-1.5 text-[#7E4D54] font-medium py-1"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {RESTAURANT.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Main Page Content */}
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-[#172332] text-[#FAF8F3] border-t border-[#FAF8F3]/10">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-14 lg:py-16">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
              <div className="md:col-span-4 space-y-4">
                <Link to="/" className="inline-flex items-center gap-3.5 bg-[#FAF8F3] px-3.5 py-2 rounded-xl">
                  <img
                    src={logo.localPath}
                    alt={logo.alt}
                    width={logo.width}
                    height={logo.height}
                    className="h-12 w-auto object-contain"
                  />
                  <span className="font-serif text-xl font-semibold text-[#172332]">
                    Andaaz Restaurant
                  </span>
                </Link>
                <p className="text-sm text-[#FAF8F3]/80 leading-relaxed max-w-sm">
                  Pakistani, Lahori, and South Asian hospitality on Fort Road opposite Badshahi Masjid. Serving in the Walled City of Lahore since {RESTAURANT.servingSince}.
                </p>
              </div>

              <div className="md:col-span-3 space-y-3">
                <h2 className="font-serif text-lg font-medium text-[#FAF8F3]">Explore</h2>
                <ul className="space-y-2 text-sm text-[#FAF8F3]/80">
                  <li>
                    <Link to="/our-story" className="hover:text-[#FAF8F3] transition-colors">
                      The House
                    </Link>
                  </li>
                  <li>
                    <Link to="/menu" className="hover:text-[#FAF8F3] transition-colors">
                      Menu & Official PDF
                    </Link>
                  </li>
                  <li>
                    <Link to="/experiences" className="hover:text-[#FAF8F3] transition-colors">
                      Private & Hosted Experiences
                    </Link>
                  </li>
                  <li>
                    <Link to="/gallery" className="hover:text-[#FAF8F3] transition-colors">
                      Gallery
                    </Link>
                  </li>
                  <li>
                    <Link to="/reservations" className="hover:text-[#FAF8F3] transition-colors">
                      Request a Table
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="md:col-span-5 space-y-3">
                <h2 className="font-serif text-lg font-medium text-[#FAF8F3]">Visit & Enquiries</h2>
                <div className="space-y-2.5 text-sm text-[#FAF8F3]/80">
                  <p className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-[#AA7C7E] shrink-0 mt-1" />
                    <span>
                      {RESTAURANT.address} ({RESTAURANT.landmark})
                    </span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 text-[#AA7C7E] shrink-0" />
                    <a
                      href={`tel:${RESTAURANT.phoneE164}`}
                      className="hover:text-[#FAF8F3] transition-colors tabular-nums"
                    >
                      {RESTAURANT.phoneDisplay}
                    </a>
                    <span className="text-[#FAF8F3]/40">·</span>
                    <a
                      href={RESTAURANT.whatsappBaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#FAF8F3] underline underline-offset-4"
                    >
                      WhatsApp
                    </a>
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#FAF8F3]/75">
                  <a
                    href={RESTAURANT.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#FAF8F3]"
                  >
                    Directions <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={RESTAURANT.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#FAF8F3]"
                  >
                    Instagram <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={RESTAURANT.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#FAF8F3]"
                  >
                    Facebook <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={RESTAURANT.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#FAF8F3]"
                  >
                    Official Website <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-[#FAF8F3]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#FAF8F3]/60 pb-14 sm:pb-0">
              <p>
                Andaaz Restaurant · Fort Road, Lahore · Dinner by reservation request, subject to restaurant confirmation.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Redesign preview concept using verified restaurant identity and photography.</span>
                <Link
                  to="/staff-demo"
                  className="text-[#FAF8F3]/75 hover:text-[#FAF8F3] underline underline-offset-4"
                >
                  Management Demo
                </Link>
                <Link
                  to="/automation-demo"
                  className="text-[#FAF8F3]/75 hover:text-[#FAF8F3] underline underline-offset-4"
                >
                  Automation Demo
                </Link>
              </div>
            </div>
          </div>
        </footer>

        {assistantSlot}
      </div>
    </MotionConfig>
  );
}
