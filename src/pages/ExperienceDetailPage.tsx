import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { Picture } from '../components/Picture';
import { EXPERIENCES, getExperienceBySlug, type ExperienceSlug } from '../data/experiences';
import { RESTAURANT } from '../data/restaurant';
import { useReservationDraft } from '../context/ReservationContext';
import { IMAGE_CLIP_REVEAL, PAGE_TRANSITION } from '../lib/motion';

export function ExperienceDetailPage({ slug }: { slug: ExperienceSlug }) {
  const exp = getExperienceBySlug(slug);
  const { updateDraft, setCurrentStep } = useReservationDraft();
  const { navigate } = useRouter();

  if (!exp) return null;

  const handleEnquire = () => {
    updateDraft({
      mode: 'occasion',
      occasionType: exp.slug,
      seating: exp.recommendedSeating,
      time: exp.isCustomTimeExperience
        ? exp.slug === 'private-brunch'
          ? '11:00 AM (Morning Brunch)'
          : '7:00 PM (Evening Reception)'
        : '20:00',
    });
    setCurrentStep(1);
    navigate('/reservations');
  };

  const otherExperiences = EXPERIENCES.filter((e) => e.slug !== exp.slug).slice(0, 3);
  const isDarkHero =
    exp.slug === 'dinner-with-music' ||
    exp.slug === 'anniversary-dinner' ||
    exp.slug === 'corporate-hosting';

  return (
    <motion.div {...PAGE_TRANSITION}>
      {/* Distinct Hero Composition per Experience Route */}
      {exp.slug === 'wedding-gatherings' ? (
        <section className="bg-[#FAF8F3] text-[#172332] pt-10 sm:pt-14 pb-12 sm:pb-16">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 space-y-8">
            <Link
              to="/experiences"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4F5D6A] hover:text-[#172332]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Hosted Experiences
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7 space-y-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
                  {exp.kicker}
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] text-balance">
                  {exp.title}
                </h1>
              </div>
              <div className="lg:col-span-5 space-y-5">
                <p className="text-base sm:text-lg text-[#4F5D6A] leading-relaxed">
                  {exp.subtitle}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleEnquire}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-6 py-3.5 text-sm font-medium transition-colors"
                  >
                    {exp.ctaLabel} <ArrowRight className="h-4 w-4" />
                  </button>
                  <a
                    href={exp.officialSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#172332]/20 text-[#172332] hover:bg-[#F2EDE3] px-5 py-3.5 text-sm font-medium transition-colors"
                  >
                    Official Page <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            <motion.div {...IMAGE_CLIP_REVEAL}>
              <Picture
                assetId={exp.heroAssetId}
                aspectClassName="aspect-[16/9] max-h-[560px] w-full rounded-2xl shadow-lg"
              />
            </motion.div>
          </div>
        </section>
      ) : exp.slug === 'celebrations' ? (
        <section className="bg-[#FAF8F3] text-[#172332] py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
            <Link
              to="/experiences"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4F5D6A] hover:text-[#172332] mb-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Hosted Experiences
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              <div className="lg:col-span-5 space-y-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
                  {exp.kicker}
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] text-balance">
                  {exp.title}
                </h1>
                <p className="text-lg text-[#4F5D6A] leading-relaxed">{exp.subtitle}</p>
                <div className="pt-2 flex flex-wrap gap-3.5">
                  <button
                    type="button"
                    onClick={handleEnquire}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-6 py-3.5 text-sm font-medium transition-colors"
                  >
                    {exp.ctaLabel} <ArrowRight className="h-4 w-4" />
                  </button>
                  <a
                    href={exp.officialSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#172332]/20 text-[#172332] hover:bg-[#F2EDE3] px-5 py-3.5 text-sm font-medium transition-colors"
                  >
                    Official Page <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-7 relative">
                <motion.div {...IMAGE_CLIP_REVEAL} className="lg:pr-14">
                  <Picture
                    assetId={exp.heroAssetId}
                    portraitAssetId="shining-moments-8"
                    aspectClassName="aspect-[3/2] rounded-2xl shadow-lg"
                  />
                </motion.div>
                <motion.div
                  {...IMAGE_CLIP_REVEAL}
                  className="mt-5 sm:mt-0 sm:w-52 lg:w-60 sm:absolute sm:-bottom-8 sm:right-0 rounded-2xl overflow-hidden shadow-xl border-4 border-[#FAF8F3]"
                >
                  <Picture assetId="shining-moments-6" aspectClassName="aspect-[3/4]" />
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section
          className={`py-12 sm:py-16 lg:py-20 ${
            isDarkHero ? 'bg-[#172332] text-[#FAF8F3]' : 'bg-[#FAF8F3] text-[#172332]'
          }`}
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
            <Link
              to="/experiences"
              className={`inline-flex items-center gap-1.5 text-xs font-medium mb-8 ${
                isDarkHero ? 'text-[#FAF8F3]/80 hover:text-[#FAF8F3]' : 'text-[#4F5D6A] hover:text-[#172332]'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Hosted Experiences
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              <div
                className={`lg:col-span-6 space-y-5 ${
                  exp.slug === 'corporate-hosting' ? 'lg:order-2' : ''
                }`}
              >
                <p
                  className={`text-xs uppercase tracking-[0.16em] font-medium ${
                    isDarkHero ? 'text-[#AA7C7E]' : 'text-[#7E4D54]'
                  }`}
                >
                  {exp.kicker}
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] text-balance">
                  {exp.title}
                </h1>
                <p
                  className={`text-lg leading-relaxed ${
                    isDarkHero ? 'text-[#FAF8F3]/85' : 'text-[#4F5D6A]'
                  }`}
                >
                  {exp.subtitle}
                </p>

                {exp.slug === 'corporate-hosting' && (
                  <div className="rounded-xl border border-[#FAF8F3]/15 bg-[#1F2B38] p-4 text-xs sm:text-sm text-[#FAF8F3]/85">
                    Advertised capacity up to{' '}
                    <span className="font-medium text-[#FAF8F3] tabular-nums">
                      {RESTAURANT.corporateCapacity.maxGuestsAdvertised} guests
                    </span>{' '}
                    across floors and dining spaces. Event-specific capacity and availability require staff confirmation.
                  </div>
                )}

                <div className="pt-3 flex flex-wrap gap-3.5">
                  <button
                    type="button"
                    onClick={handleEnquire}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-6 py-3.5 text-sm font-medium transition-colors"
                  >
                    {exp.ctaLabel} <ArrowRight className="h-4 w-4" />
                  </button>
                  <a
                    href={exp.officialSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3.5 text-sm font-medium transition-colors ${
                      isDarkHero
                        ? 'border-[#FAF8F3]/30 text-[#FAF8F3] hover:bg-[#FAF8F3]/10'
                        : 'border-[#172332]/20 text-[#172332] hover:bg-[#F2EDE3]'
                    }`}
                  >
                    Official Page <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <motion.div {...IMAGE_CLIP_REVEAL} className="lg:col-span-6">
                <Picture
                  assetId={exp.heroAssetId}
                  portraitAssetId={
                    exp.slug === 'dinner-with-music' ? 'dinner-with-music-2' : undefined
                  }
                  aspectClassName={
                    exp.slug === 'anniversary-dinner'
                      ? 'aspect-[4/5] max-w-md mx-auto'
                      : exp.slug === 'dinner-with-music'
                        ? 'aspect-[3/2]'
                        : 'aspect-[4/3]'
                  }
                  className="rounded-2xl shadow-xl"
                />
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Narrative & Planning Notes */}
      <section className="bg-[#F2EDE3]/70 border-y border-[#172332]/10 py-14 sm:py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-serif text-3xl font-medium text-[#172332]">
              Setting & Atmosphere
            </h2>
            {exp.narrative.map((para) => (
              <p key={para} className="text-base text-[#4F5D6A] leading-relaxed">
                {para}
              </p>
            ))}

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {exp.secondaryAssetIds.map((id) => (
                <Picture
                  key={id}
                  assetId={id}
                  aspectClassName={
                    exp.slug === 'anniversary-dinner' && id === 'anniversary-dinner-lahore-1'
                      ? 'aspect-[4/5] rounded-2xl shadow-xs'
                      : 'aspect-[4/3] rounded-2xl shadow-xs'
                  }
                />
              ))}
            </div>
          </div>

          <aside className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-[#FAF8F3] border border-[#172332]/12 p-6 sm:p-8 space-y-4">
              <h2 className="font-serif text-2xl font-medium text-[#172332]">
                Planning & Confirmation Notes
              </h2>
              <ul className="space-y-3 text-sm text-[#4F5D6A] leading-relaxed">
                {exp.planningNotes.map((note) => (
                  <li key={note} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#7E4D54] shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-[#172332]/10">
                <button
                  type="button"
                  onClick={handleEnquire}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-3 text-sm font-medium transition-colors"
                >
                  {exp.ctaLabel} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Related Experiences */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-14 sm:py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#172332]">
            Other Hosted Experiences
          </h2>
          <Link to="/experiences" className="text-sm font-medium text-[#7E4D54] hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {otherExperiences.map((other) => (
            <Link
              key={other.slug}
              to={other.route}
              className="group rounded-2xl border border-[#172332]/10 bg-[#FAF8F3] overflow-hidden transition-transform hover:-translate-y-1"
            >
              <Picture
                assetId={other.heroAssetId}
                aspectClassName="aspect-[4/3]"
                imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="p-5">
                <p className="text-xs text-[#7E4D54]">{other.kicker}</p>
                <h3 className="font-serif text-xl font-medium text-[#172332] mt-1">
                  {other.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
