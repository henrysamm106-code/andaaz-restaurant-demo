import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from '../lib/router';
import { Picture } from '../components/Picture';
import { RESTAURANT } from '../data/restaurant';
import { IMAGE_CLIP_REVEAL, PAGE_TRANSITION, SECTION_REVEAL } from '../lib/motion';

export function OurStoryPage() {
  return (
    <motion.div {...PAGE_TRANSITION}>
      {/* Opening Panoramic Header */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 pb-12">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
            The House · Fort Road, Lahore
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] text-[#172332] text-balance">
            Serving in the Walled City since {RESTAURANT.servingSince}.
          </h1>
          <p className="text-base sm:text-lg text-[#4F5D6A] leading-relaxed">
            At {RESTAURANT.shortAddress}, directly {RESTAURANT.landmark.toLowerCase()}, Andaaz welcomes guests into a four-floor residence shaped for unhurried Pakistani and Lahori dining.
          </p>
        </div>

        <motion.div {...IMAGE_CLIP_REVEAL} className="mt-10">
          <Picture
            assetId="walled-city-panorama"
            aspectClassName="aspect-[2/1] rounded-2xl shadow-md"
          />
          <p className="mt-3 text-xs text-[#4F5D6A]">
            Badshahi Masjid and the rooftops of Shahi Mohallah viewed from Andaaz Restaurant.
          </p>
        </motion.div>
      </section>

      {/* Architectural Story & Indoor/Rooftop Spaces */}
      <section className="bg-[#F2EDE3]/70 border-y border-[#172332]/10 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <motion.div {...SECTION_REVEAL} className="lg:col-span-6 space-y-5">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#172332]">
              Indoor dining salons and open-air terraces.
            </h2>
            <p className="text-base text-[#4F5D6A] leading-relaxed">
              Guests ascend through four floors of heritage architecture—passing intimate indoor dining rooms framed by arched windows before reaching the open-air rooftop terraces above Fort Road.
            </p>
            <p className="text-base text-[#4F5D6A] leading-relaxed">
              Whether you prefer the sheltered warmth of an indoor room or an open terrace table facing Badshahi Masjid, seating preferences can be noted with your request and are confirmed by our hospitality team.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/reservations"
                className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-3 text-sm font-medium transition-colors"
              >
                Request a Table <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/experiences"
                className="inline-flex items-center gap-2 rounded-xl border border-[#172332]/20 hover:bg-[#FAF8F3] text-[#172332] px-5 py-3 text-sm font-medium transition-colors"
              >
                Explore Hosted Experiences
              </Link>
            </div>
          </motion.div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Picture
              assetId="walled-city-street"
              aspectClassName="aspect-[4/5] rounded-2xl shadow-sm"
            />
            <Picture
              assetId="house-interior-detail"
              aspectClassName="aspect-[4/5] rounded-2xl shadow-sm sm:mt-8"
            />
          </div>
        </div>
      </section>

      {/* Evening Atmosphere */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <Picture
              assetId="rooftop-dining-landscape"
              portraitAssetId="rooftop-dining-portrait"
              aspectClassName="aspect-[3/2] rounded-2xl shadow-md"
            />
          </div>
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
              Hospitality on Fort Road
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#172332]">
              Rooted in Old Lahore’s evening rhythm.
            </h2>
            <p className="text-base text-[#4F5D6A] leading-relaxed">
              From family celebrations to visiting guests discovering Lahore for the first time, our kitchen prepares Tandoor, Karahi, Seafood, Desserts, and house teas to order.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-sm font-medium">
              <Link to="/menu" className="text-[#7E4D54] hover:underline underline-offset-4">
                Browse Menu Highlights
              </Link>
              <Link to="/gallery" className="text-[#172332] hover:text-[#7E4D54]">
                View Venue Gallery
              </Link>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
