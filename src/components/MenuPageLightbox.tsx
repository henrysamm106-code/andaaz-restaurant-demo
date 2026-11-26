import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, X } from 'lucide-react';
import { OFFICIAL_MENU_PAGES } from '../data/menu';
import { RESTAURANT } from '../data/restaurant';

interface MenuPageLightboxProps {
  activePageIndex: number | null;
  onClose: () => void;
  onChangePageIndex: (index: number) => void;
}

export function MenuPageLightbox({
  activePageIndex,
  onClose,
  onChangePageIndex,
}: MenuPageLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const isOpen = activePageIndex !== null && OFFICIAL_MENU_PAGES[activePageIndex] !== undefined;
  const activePage = isOpen ? OFFICIAL_MENU_PAGES[activePageIndex] : null;

  useEffect(() => {
    setZoomed(false);
  }, [activePageIndex]);

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    } else {
      document.body.style.overflow = '';
      if (triggerElementRef.current) {
        triggerElementRef.current.focus();
        triggerElementRef.current = null;
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activePageIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onChangePageIndex((activePageIndex + 1) % OFFICIAL_MENU_PAGES.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onChangePageIndex(
          (activePageIndex - 1 + OFFICIAL_MENU_PAGES.length) % OFFICIAL_MENU_PAGES.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, activePageIndex, onClose, onChangePageIndex]);

  if (!isOpen || !activePage || activePageIndex === null) return null;

  const handlePrev = () =>
    onChangePageIndex(
      (activePageIndex - 1 + OFFICIAL_MENU_PAGES.length) % OFFICIAL_MENU_PAGES.length
    );
  const handleNext = () =>
    onChangePageIndex((activePageIndex + 1) % OFFICIAL_MENU_PAGES.length);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activePage.title}
      className="fixed inset-0 z-50 bg-[#172332]/95 backdrop-blur-xs flex flex-col justify-between p-4 sm:p-6 lg:p-8"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null || zoomed) return;
        const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
        const delta = endX - touchStartX.current;
        if (delta > 48) handlePrev();
        if (delta < -48) handleNext();
        touchStartX.current = null;
      }}
    >
      {/* Top Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 text-[#FAF8F3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {OFFICIAL_MENU_PAGES.map((page, idx) => {
            const active = idx === activePageIndex;
            return (
              <button
                key={page.pageNumber}
                type="button"
                onClick={() => onChangePageIndex(idx)}
                className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors min-h-[36px] ${
                  active
                    ? 'bg-[#7E4D54] text-[#FAF8F3]'
                    : 'bg-[#FAF8F3]/10 hover:bg-[#FAF8F3]/20 text-[#FAF8F3]/85'
                }`}
              >
                Page {page.pageNumber}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? 'Fit menu page to screen' : 'Zoom in on menu page'}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAF8F3]/10 hover:bg-[#FAF8F3]/20 text-[#FAF8F3] px-3 py-2 text-xs sm:text-sm font-medium transition-colors min-h-[40px] whitespace-nowrap"
          >
            {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
            <span>{zoomed ? 'Fit View' : 'Zoom In'}</span>
          </button>

          <a
            href={RESTAURANT.localMenuPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#FAF8F3]/10 hover:bg-[#FAF8F3]/20 text-[#FAF8F3] px-3 py-2 text-xs sm:text-sm font-medium transition-colors min-h-[40px] whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </a>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu page viewer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAF8F3]/15 hover:bg-[#FAF8F3]/25 text-[#FAF8F3] px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors min-h-[40px] whitespace-nowrap"
          >
            <span>Close</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Menu Page Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center my-3 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous menu page"
          className="hidden sm:inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#FAF8F3]/10 hover:bg-[#FAF8F3]/20 text-[#FAF8F3] transition-colors mr-4 shrink-0"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div
          className={`relative max-h-full max-w-4xl w-full flex justify-center ${
            zoomed ? 'overflow-auto items-start max-h-[76vh] rounded-xl' : 'items-center'
          }`}
        >
          <img
            src={activePage.localPath}
            alt={activePage.alt}
            onClick={() => setZoomed((z) => !z)}
            className={`rounded-xl shadow-2xl border border-[#FAF8F3]/15 transition-transform ${
              zoomed
                ? 'w-[140%] sm:w-[115%] max-w-none cursor-zoom-out'
                : 'max-h-[74vh] w-auto max-w-full object-contain cursor-zoom-in'
            }`}
          />
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next menu page"
          className="hidden sm:inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#FAF8F3]/10 hover:bg-[#FAF8F3]/20 text-[#FAF8F3] transition-colors ml-4 shrink-0"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom Info & Mobile Controls */}
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-[#FAF8F3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[#AA7C7E]">
            {activePage.sectionsLabel}
          </p>
          <h3 className="font-serif text-xl sm:text-2xl font-medium mt-0.5">
            {activePage.title}
          </h3>
          <p className="text-xs sm:text-sm text-[#FAF8F3]/75 mt-0.5">{activePage.caption}</p>
        </div>

        <div className="flex sm:hidden items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous menu page"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FAF8F3]/10 text-[#FAF8F3] py-2.5 text-sm min-h-[44px]"
          >
            <ChevronLeft className="h-4 w-4" /> Prev Page
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next menu page"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FAF8F3]/10 text-[#FAF8F3] py-2.5 text-sm min-h-[44px]"
          >
            Next Page <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
