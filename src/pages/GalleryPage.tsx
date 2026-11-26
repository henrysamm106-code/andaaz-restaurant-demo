import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from '../lib/router';
import { Picture } from '../components/Picture';
import { GalleryLightbox } from '../components/GalleryLightbox';
import { GALLERY_SCENES, type GalleryCategory } from '../data/assets';
import { PAGE_TRANSITION } from '../lib/motion';

const CATEGORIES: GalleryCategory[] = [
  'All',
  'Rooftop & Views',
  'Dining Rooms',
  'Music & Evenings',
  'Celebrations & Hosting',
];

export function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const visibleScenes = useMemo(() => {
    if (selectedCategory === 'All') return GALLERY_SCENES;
    return GALLERY_SCENES.filter((scene) => scene.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <motion.div {...PAGE_TRANSITION}>
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
              Venue & Occasion Photography
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] text-[#172332]">
              Scenes from Fort Road
            </h1>
            <p className="text-base text-[#4F5D6A] leading-relaxed">
              Verified photographs from Andaaz Restaurant’s terraces, dining rooms, musical evenings, and hosted occasions. Select any photograph to view it full-size.
            </p>
          </div>
          <Link
            to="/reservations"
            className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-3 text-sm font-medium transition-colors self-start lg:self-auto"
          >
            Request a Table <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Gallery categories">
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSelectedCategory(category);
                  setLightboxIndex(null);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors min-h-[40px] ${
                  active
                    ? 'bg-[#172332] text-[#FAF8F3]'
                    : 'bg-[#F2EDE3] text-[#172332] hover:bg-[#E7DFD1]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      {/* Deduplicated Scene Grid */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleScenes.map((scene, idx) => (
            <button
              key={scene.sceneGroup}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className="group text-left rounded-2xl overflow-hidden border border-[#172332]/10 bg-[#FAF8F3] transition-transform duration-200 hover:-translate-y-1 flex flex-col"
            >
              <Picture
                assetId={scene.landscapeId}
                portraitAssetId={scene.portraitId}
                aspectClassName="aspect-[4/3] w-full"
                imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="p-5 space-y-1">
                <p className="text-xs text-[#7E4D54]">{scene.category}</p>
                <h2 className="font-serif text-xl font-medium text-[#172332]">
                  {scene.title}
                </h2>
                <p className="text-sm text-[#4F5D6A] leading-relaxed">{scene.caption}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <GalleryLightbox
        scenes={visibleScenes}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />
    </motion.div>
  );
}
