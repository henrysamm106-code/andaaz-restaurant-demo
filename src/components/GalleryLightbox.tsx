import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ASSETS, type GalleryScene } from '../data/assets';

interface GalleryLightboxProps {
  scenes: GalleryScene[];
  activeIndex: number | null;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
}

export function GalleryLightbox({
  scenes,
  activeIndex,
  onClose,
  onChangeIndex,
}: GalleryLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [useRemoteFallback, setUseRemoteFallback] = useState(false);

  const isOpen = activeIndex !== null && scenes[activeIndex] !== undefined;
  const activeScene = isOpen ? scenes[activeIndex] : null;
  const activeAsset = activeScene ? ASSETS[activeScene.landscapeId] : null;

  useEffect(() => {
    setUseRemoteFallback(false);
  }, [activeIndex]);

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
    if (!isOpen || activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onChangeIndex((activeIndex + 1) % scenes.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onChangeIndex((activeIndex - 1 + scenes.length) % scenes.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, activeIndex, scenes.length, onClose, onChangeIndex]);

  if (!isOpen || !activeScene || !activeAsset || activeIndex === null) return null;

  const handlePrev = () => onChangeIndex((activeIndex - 1 + scenes.length) % scenes.length);
  const handleNext = () => onChangeIndex((activeIndex + 1) % scenes.length);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activeScene.title}
      className="fixed inset-0 z-50 bg-[#172332]/95 backdrop-blur-xs flex flex-col justify-between p-4 sm:p-6 lg:p-10"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
        const delta = endX - touchStartX.current;
        if (delta > 48) handlePrev();
        if (delta < -48) handleNext();
        touchStartX.current = null;
      }}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between text-[#FAF8F3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs sm:text-sm text-[#FAF8F3]/75 tabular-nums">
          <span>{activeScene.category}</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>
            {activeIndex + 1} of {scenes.length}
          </span>
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close lightbox"
          className="inline-flex items-center gap-2 rounded-xl bg-[#FAF8F3]/10 hover:bg-[#FAF8F3]/20 text-[#FAF8F3] px-3.5 py-2 text-sm font-medium transition-colors min-h-[44px]"
        >
          <span>Close</span>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center my-4 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous photograph"
          className="hidden sm:inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#FAF8F3]/10 hover:bg-[#FAF8F3]/20 text-[#FAF8F3] transition-colors mr-4 shrink-0"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="relative max-h-full max-w-5xl w-full flex items-center justify-center">
          <img
            src={useRemoteFallback ? activeAsset.fallbackUrl : activeAsset.localPath}
            alt={activeAsset.alt}
            referrerPolicy="no-referrer"
            onError={() => setUseRemoteFallback(true)}
            className="max-h-[72vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
          />
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next photograph"
          className="hidden sm:inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#FAF8F3]/10 hover:bg-[#FAF8F3]/20 text-[#FAF8F3] transition-colors ml-4 shrink-0"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Bottom Caption & Mobile Controls */}
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-[#FAF8F3]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-2xl">
          <h3 className="font-serif text-xl sm:text-2xl font-medium">{activeScene.title}</h3>
          <p className="text-sm text-[#FAF8F3]/80 mt-1">{activeScene.caption}</p>
        </div>

        <div className="flex sm:hidden items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous photograph"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FAF8F3]/10 text-[#FAF8F3] py-2.5 text-sm min-h-[44px]"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next photograph"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FAF8F3]/10 text-[#FAF8F3] py-2.5 text-sm min-h-[44px]"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
