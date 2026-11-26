import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from '../lib/router';
import { Picture } from '../components/Picture';
import { EXPERIENCES } from '../data/experiences';
import { RESTAURANT } from '../data/restaurant';
import { IMAGE_CLIP_REVEAL, PAGE_TRANSITION } from '../lib/motion';

export function ExperiencesPage() {
  return (
    <motion.div {...PAGE_TRANSITION}>
      {/* Hero Banner */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 pb-12">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
            Private & Hosted Occasions
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] text-[#172332] text-balance">
            Gatherings across four floors on Fort Road.
          </h1>
          <p className="text-base sm:text-lg text-[#4F5D6A] leading-relaxed">
            From intimate anniversary tables to private family celebrations, corporate hosting up to {RESTAURANT.corporateCapacity.maxGuestsAdvertised} guests across spaces, and planned daytime brunches, each occasion is arranged by direct enquiry with our team.
          </p>
        </div>

        <motion.div {...IMAGE_CLIP_REVEAL} className="mt-10">
          <Picture
            assetId="hosted-rooftop-panorama"
            aspectClassName="aspect-[2/1] rounded-2xl shadow-md"
          />
        </motion.div>
      </section>

      {/* Spaces Overview */}
      <section className="bg-[#F2EDE3]/70 border-y border-[#172332]/10 py-14 sm:py-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl overflow-hidden bg-[#FAF8F3] border border-[#172332]/10">
            <Picture assetId="hosted-guests" aspectClassName="aspect-[3/2]" />
            <div className="p-5">
              <h2 className="font-serif text-2xl font-medium text-[#172332]">Hosted Evenings</h2>
              <p className="text-sm text-[#4F5D6A] mt-1.5">
                Coordinated group dining across indoor salons and open-air terraces.
              </p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden bg-[#FAF8F3] border border-[#172332]/10">
            <Picture assetId="private-dining-room" aspectClassName="aspect-[3/2]" />
            <div className="p-5">
              <h2 className="font-serif text-2xl font-medium text-[#172332]">Private Dining Rooms</h2>
              <p className="text-sm text-[#4F5D6A] mt-1.5">
                Sheltered indoor rooms overlooking Lahore’s Walled City.
              </p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden bg-[#FAF8F3] border border-[#172332]/10">
            <Picture assetId="family-rooftop-gathering" aspectClassName="aspect-[3/2]" />
            <div className="p-5">
              <h2 className="font-serif text-2xl font-medium text-[#172332]">Rooftop Gatherings</h2>
              <p className="text-sm text-[#4F5D6A] mt-1.5">
                Open-air family and celebration tables beside Badshahi Masjid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Six Linked Experiences */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
        <div className="space-y-2 mb-10">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#172332]">
            Explore Occasion Guides
          </h2>
          <p className="text-sm text-[#4F5D6A]">
            Select an experience to read planning notes and prepare an enquiry for that occasion.
          </p>
        </div>

        <div className="space-y-8">
          {EXPERIENCES.map((exp, idx) => {
            const reverse = idx % 2 === 1;
            return (
              <article
                key={exp.slug}
                className="rounded-2xl border border-[#172332]/10 bg-[#FAF8F3] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
              >
                <div className={`lg:col-span-6 ${reverse ? 'lg:order-2' : ''}`}>
                  <Link to={exp.route} className="block h-full">
                    <Picture
                      assetId={exp.heroAssetId}
                      aspectClassName="aspect-[4/3] lg:h-full"
                    />
                  </Link>
                </div>
                <div className="lg:col-span-6 p-7 sm:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#7E4D54] font-medium">
                      {exp.kicker}
                    </p>
                    <h3 className="font-serif text-3xl sm:text-4xl font-medium text-[#172332]">
                      <Link to={exp.route} className="hover:text-[#7E4D54] transition-colors">
                        {exp.title}
                      </Link>
                    </h3>
                    <p className="text-base text-[#4F5D6A] leading-relaxed">
                      {exp.shortDescription}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <Link
                      to={exp.route}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-3 text-sm font-medium transition-colors"
                    >
                      View {exp.title} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}
