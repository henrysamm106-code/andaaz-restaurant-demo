import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, ExternalLink, ArrowRight, MessageSquare } from 'lucide-react';
import { Link } from '../lib/router';
import { Picture } from '../components/Picture';
import { RESTAURANT } from '../data/restaurant';
import { PAGE_TRANSITION } from '../lib/motion';

export function ContactPage() {
  return (
    <motion.div {...PAGE_TRANSITION}>
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
                Visit & Enquiries
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] text-[#172332]">
                Contact & Directions
              </h1>
              <p className="text-base text-[#4F5D6A] leading-relaxed">
                Reach the Andaaz hospitality team directly by telephone or WhatsApp for table confirmations, dietary questions, opening times, or private event arrangements.
              </p>
            </div>

            <div className="rounded-2xl bg-[#F2EDE3] border border-[#172332]/12 p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-3.5">
                <MapPin className="h-5 w-5 text-[#7E4D54] shrink-0 mt-1" />
                <div className="space-y-1">
                  <h2 className="font-serif text-xl font-medium text-[#172332]">
                    Address — {RESTAURANT.branch}
                  </h2>
                  <p className="text-sm text-[#4F5D6A] leading-relaxed">
                    {RESTAURANT.address}
                  </p>
                  <p className="text-sm font-medium text-[#172332]">{RESTAURANT.landmark}</p>
                  <p className="text-xs text-[#4F5D6A] leading-relaxed pt-1">
                    {RESTAURANT.singleLocationNote}
                  </p>
                  <a
                    href={RESTAURANT.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7E4D54] hover:underline pt-1"
                  >
                    Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              <div className="border-t border-[#172332]/10 pt-5 flex items-start gap-3.5">
                <Phone className="h-5 w-5 text-[#7E4D54] shrink-0 mt-1" />
                <div className="space-y-2">
                  <h2 className="font-serif text-xl font-medium text-[#172332]">
                    Telephone & WhatsApp
                  </h2>
                  <p className="text-base font-medium text-[#172332] tabular-nums">
                    <a href={`tel:${RESTAURANT.phoneE164}`} className="hover:text-[#7E4D54]">
                      {RESTAURANT.phoneDisplay}
                    </a>
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <a
                      href={`tel:${RESTAURANT.phoneE164}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#172332] text-[#FAF8F3] px-4 py-2.5 text-sm font-medium hover:bg-[#1F2B38] transition-colors"
                    >
                      <Phone className="h-4 w-4" /> Call Restaurant
                    </a>
                    <a
                      href={RESTAURANT.whatsappBaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] text-[#FAF8F3] px-4 py-2.5 text-sm font-medium hover:bg-[#693E45] transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" /> Open WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#172332]/10 pt-5 space-y-2">
                <h2 className="font-serif text-xl font-medium text-[#172332]">Official Channels</h2>
                <div className="flex flex-wrap gap-4 text-sm font-medium text-[#7E4D54]">
                  <a
                    href={RESTAURANT.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    Official Website <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={RESTAURANT.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    Instagram <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={RESTAURANT.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    Facebook <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#172332]/12 bg-white p-6 space-y-3 text-sm text-[#4F5D6A]">
              <p className="font-medium text-[#172332]">Arrival & Verification Guidance</p>
              <p className="leading-relaxed">
                Dinner requests are offered for 5:00 PM – 10:00 PM subject to confirmation. Because weekly schedules, Walled City vehicle access, parking, lift access, and dish-specific allergen details are not published online, please confirm them directly with the team on {RESTAURANT.phoneDisplay} before travelling.
              </p>
              <div className="pt-1">
                <Link
                  to="/reservations"
                  className="inline-flex items-center gap-1.5 font-medium text-[#7E4D54] hover:underline"
                >
                  Prepare a guided table request <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <Picture
              assetId="house-evening-landscape"
              portraitAssetId="house-evening-portrait"
              aspectClassName="aspect-[3/2] rounded-2xl shadow-md"
            />
            <Picture
              assetId="dining-table-landscape"
              portraitAssetId="dining-table-portrait"
              aspectClassName="aspect-[3/2] rounded-2xl shadow-md"
            />
          </div>
        </div>
      </section>
    </motion.div>
  );
}
