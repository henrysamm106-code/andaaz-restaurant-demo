import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Phone,
  AlertCircle,
  Edit3,
  MapPin,
} from 'lucide-react';
import { useReservationDraft } from '../context/ReservationContext';
import {
  buildFixedWhatsAppUrl,
  buildWhatsAppRequestMessage,
  CUSTOM_OCCASION_TIME_SUGGESTIONS,
  DINNER_TIME_SLOTS,
  formatFullDate,
  formatSeatingLabel,
  formatTimeDisplay,
  getKarachiToday,
  isDatePastInKarachi,
  isDinnerSlotPastToday,
  OCCASION_LABELS,
  validateOptionalEmail,
  validatePhoneNumber,
} from '../lib/karachiTime';
import { EXPERIENCES, type ExperienceSlug } from '../data/experiences';
import { BOOKING_CITY_OPTIONS, OFFICIAL_BRANCHES, RESTAURANT } from '../data/restaurant';
import { EASE_OUT, PAGE_TRANSITION } from '../lib/motion';

const STEPS = [
  { num: 1, label: 'Date & Guests' },
  { num: 2, label: 'Seating & Notes' },
  { num: 3, label: 'Your Details' },
  { num: 4, label: 'Review & Send' },
];

export function ReservationsPage() {
  const {
    draft,
    updateDraft,
    currentStep,
    setCurrentStep,
    resetDraft,
    draftEventKey,
    lastSubmittedRef,
    setLastSubmittedRef,
  } = useReservationDraft();
  const [stepError, setStepError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [whatsappOpened, setWhatsappOpened] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedOfficial, setCopiedOfficial] = useState(false);
  const [guestInput, setGuestInput] = useState<string>(String(draft.guests));
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const minDate = getKarachiToday();

  useEffect(() => {
    setGuestInput(String(draft.guests));
  }, [draft.guests]);

  const isCustomTimeOccasion =
    draft.mode === 'occasion' &&
    (draft.occasionType === 'private-brunch' ||
      draft.occasionType === 'corporate-hosting' ||
      draft.occasionType === 'wedding-gatherings');

  // Ensure dinner slot isn't stuck on a past time if user selected today
  useEffect(() => {
    if (!isCustomTimeOccasion && isDinnerSlotPastToday(draft.date, draft.time)) {
      const nextAvailable = DINNER_TIME_SLOTS.find((s) => !isDinnerSlotPastToday(draft.date, s.value));
      if (nextAvailable) {
        updateDraft({ time: nextAvailable.value });
      }
    }
  }, [draft.date, draft.time, isCustomTimeOccasion, updateDraft]);

  const goToStep = (targetStep: number) => {
    setStepError(null);
    setFieldErrors({});
    setCurrentStep(targetStep);
    requestAnimationFrame(() => {
      stepHeadingRef.current?.focus({ preventScroll: false });
    });
  };

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!draft.date || isDatePastInKarachi(draft.date)) {
      errors.date = 'Please choose today or a future date in Pakistan time.';
    }
    if (!draft.time.trim()) {
      errors.time = isCustomTimeOccasion
        ? 'Please enter your preferred arrival time or session.'
        : 'Please select a preferred arrival time.';
    } else if (!isCustomTimeOccasion && isDinnerSlotPastToday(draft.date, draft.time)) {
      errors.time = 'That arrival time has already passed in Lahore today. Please choose a later slot or another date.';
    }
    if (!Number.isInteger(draft.guests) || draft.guests < 1) {
      errors.guests = 'Please enter at least 1 guest.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setStepError('Please check the highlighted fields before continuing.');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!draft.name.trim()) {
      errors.name = 'Please enter a name for the reservation request.';
    }
    const phoneErr = validatePhoneNumber(draft.phone);
    if (phoneErr) errors.phone = phoneErr;
    const emailErr = validateOptionalEmail(draft.email);
    if (emailErr) errors.email = emailErr;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setStepError('Please complete your required contact details before reviewing.');
      return false;
    }
    return true;
  };

  const persistPendingRequest = async () => {
    setSubmittingRequest(true);
    try {
      const occasionLabel =
        draft.mode === 'occasion'
          ? draft.occasionType
            ? OCCASION_LABELS[draft.occasionType]
            : 'Private / Hosted Occasion'
          : '';
      const res = await fetch('/api/public/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_event_id: draftEventKey,
          customer_name: draft.name.trim(),
          customer_phone: draft.phone.trim(),
          customer_email: draft.email.trim(),
          guest_city: draft.guestCity.trim() || 'Lahore',
          reservation_date: draft.date,
          reservation_time: draft.time,
          guest_count: draft.guests,
          seating_preference: draft.seating,
          special_occasion: occasionLabel,
          special_requests: draft.notes.trim(),
          source: 'website',
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok && json.bookingReference) {
        setLastSubmittedRef(json.bookingReference);
      }
    } catch {
      // Do not block WhatsApp handoff if backend persistence fails transiently
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 3) {
      if (!validateStep3()) return;
      await persistPendingRequest();
      goToStep(4);
      return;
    }
    if (currentStep < 4) goToStep(currentStep + 1);
  };

  const handleStepClick = async (num: number) => {
    if (num < currentStep) {
      goToStep(num);
    } else if (num === 2 && validateStep1()) {
      goToStep(2);
    } else if (num === 3 && validateStep1()) {
      goToStep(3);
    } else if (num === 4 && validateStep1() && validateStep3()) {
      await persistPendingRequest();
      goToStep(4);
    }
  };

  const whatsappMessage = buildWhatsAppRequestMessage(draft);
  const whatsappUrl = buildFixedWhatsAppUrl(whatsappMessage);

  const handleCopy = async (target: 'whatsapp' | 'official') => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      if (target === 'whatsapp') {
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 3000);
      } else {
        setCopiedOfficial(true);
        setTimeout(() => setCopiedOfficial(false), 3000);
      }
    } catch {
      // Clipboard blocked
    }
  };

  const allDinnerSlotsPassedToday =
    !isCustomTimeOccasion &&
    DINNER_TIME_SLOTS.every((s) => isDinnerSlotPastToday(draft.date, s.value));

  return (
    <motion.div {...PAGE_TRANSITION} className="pb-24">
      {/* Header */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 pt-10 sm:pt-14 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
              Guided Reservation Request · Asia/Karachi Time
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] text-[#172332]">
              Request a Table
            </h1>
            <p className="text-base text-[#4F5D6A] leading-relaxed">
              Prepare your dinner or occasion enquiry below, review every detail, and hand off directly to Andaaz Restaurant on WhatsApp ({RESTAURANT.phoneDisplay}) or the official reservation page. All requests remain subject to restaurant confirmation.
            </p>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-[#F2EDE3] border border-[#172332]/12 p-5 space-y-2.5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#7E4D54] font-medium">
              Branch &amp; Official Contact Number
            </p>
            {OFFICIAL_BRANCHES.map((branch) => (
              <div key={branch.id} className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-serif text-xl font-medium text-[#172332] leading-snug">
                    {branch.name}
                  </p>
                </div>
                <p className="text-xs text-[#4F5D6A] leading-relaxed">
                  {branch.address} · {branch.landmark}
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <a
                    href={`tel:${branch.phoneE164}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7E4D54] hover:underline tabular-nums"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {branch.phoneDisplay}
                  </a>
                  <span className="text-xs text-[#4F5D6A]">Telephone &amp; WhatsApp Desk</span>
                </div>
              </div>
            ))}
            <p className="pt-2 border-t border-[#172332]/10 text-[11px] text-[#4F5D6A] leading-relaxed">
              {RESTAURANT.singleLocationNote}
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <nav aria-label="Reservation steps" className="mt-8">
          <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STEPS.map((s) => {
              const isCurrent = currentStep === s.num;
              const isDone = currentStep > s.num;
              return (
                <li key={s.num}>
                  <button
                    type="button"
                    onClick={() => handleStepClick(s.num)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-colors min-h-[56px] ${
                      isCurrent
                        ? 'bg-[#172332] text-[#FAF8F3] border-[#172332]'
                        : isDone
                          ? 'bg-[#F2EDE3] text-[#172332] border-[#172332]/20 hover:bg-[#EAE2D3]'
                          : 'bg-[#FAF8F3] text-[#4F5D6A] border-[#172332]/10'
                    }`}
                  >
                    <span className="block text-[11px] uppercase tracking-wider opacity-75 tabular-nums">
                      Step {s.num} of 4
                    </span>
                    <span className="block text-sm font-medium mt-0.5">{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </section>

      {/* Main Content Grid: Form Step + Live Editable Summary */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Step Card */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.18, ease: EASE_OUT } }}
                className="rounded-2xl bg-white border border-[#172332]/12 p-6 sm:p-8 shadow-xs"
              >
                {stepError && (
                  <div
                    role="alert"
                    className="mb-6 rounded-xl bg-[#7E4D54]/10 border border-[#7E4D54]/30 px-4 py-3 text-sm text-[#7E4D54] flex items-start gap-2.5"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{stepError}</span>
                  </div>
                )}

                {/* STEP 1 */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2
                        ref={stepHeadingRef}
                        tabIndex={-1}
                        className="font-serif text-3xl font-medium text-[#172332] outline-none"
                      >
                        1. Choose visit type, date & guests
                      </h2>
                      <p className="text-sm text-[#4F5D6A] mt-1">
                        Dinner slots reflect published preference options, not live table inventory.
                      </p>
                    </div>

                    {/* Visit Mode Toggle */}
                    <div className="space-y-2">
                      <span className="block text-sm font-medium text-[#172332]">
                        Are you planning an ordinary dinner or a hosted occasion?
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft({
                              mode: 'dinner',
                              occasionType: '',
                            })
                          }
                          className={`rounded-xl border p-4 text-left transition-colors ${
                            draft.mode === 'dinner'
                              ? 'border-[#7E4D54] bg-[#7E4D54]/6 text-[#172332]'
                              : 'border-[#172332]/15 hover:bg-[#FAF8F3] text-[#4F5D6A]'
                          }`}
                        >
                          <span className="block text-sm font-semibold text-[#172332]">
                            Ordinary Dinner
                          </span>
                          <span className="block text-xs mt-1">
                            Evening arrival preferences (5:00 PM – 10:00 PM)
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft({
                              mode: 'occasion',
                              occasionType: draft.occasionType || 'celebrations',
                            })
                          }
                          className={`rounded-xl border p-4 text-left transition-colors ${
                            draft.mode === 'occasion'
                              ? 'border-[#7E4D54] bg-[#7E4D54]/6 text-[#172332]'
                              : 'border-[#172332]/15 hover:bg-[#FAF8F3] text-[#4F5D6A]'
                          }`}
                        >
                          <span className="block text-sm font-semibold text-[#172332]">
                            Private or Hosted Occasion
                          </span>
                          <span className="block text-xs mt-1">
                            Private brunch, corporate, music, weddings, or celebrations
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Specific Occasion Selector */}
                    {draft.mode === 'occasion' && (
                      <div>
                        <label
                          htmlFor="res-occasion"
                          className="block text-sm font-medium text-[#172332] mb-1.5"
                        >
                          Occasion Type
                        </label>
                        <select
                          id="res-occasion"
                          value={draft.occasionType}
                          onChange={(e) =>
                            updateDraft({ occasionType: e.target.value as ExperienceSlug | '' })
                          }
                          className="w-full rounded-xl border border-[#172332]/20 bg-[#FAF8F3] px-4 py-3 text-sm text-[#172332] min-h-[44px]"
                        >
                          <option value="">General Private / Hosted Occasion</option>
                          {EXPERIENCES.map((exp) => (
                            <option key={exp.slug} value={exp.slug}>
                              {exp.title}
                            </option>
                          ))}
                        </select>
                        {draft.occasionType === 'private-brunch' && (
                          <p className="mt-2 text-xs text-[#4F5D6A]">
                            Private brunch is a planned enquiry rather than daily service. Share your desired daytime arrival window below for restaurant confirmation.
                          </p>
                        )}
                        {draft.occasionType === 'dinner-with-music' && (
                          <p className="mt-2 text-xs text-[#4F5D6A]">
                            Live music is an arrangement to discuss with the team rather than a guaranteed nightly show.
                          </p>
                        )}
                      </div>
                    )}

                    {/* City & Assigned Branch */}
                    <div className="rounded-xl bg-[#FAF8F3] border border-[#172332]/12 p-4 sm:p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label
                          htmlFor="res-guest-city"
                          className="block text-sm font-medium text-[#172332]"
                        >
                          Which city are you enquiring from?
                        </label>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7E4D54]">
                          <MapPin className="h-3.5 w-3.5" />
                          Routed to: {RESTAURANT.branch}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {BOOKING_CITY_OPTIONS.map((cityOpt) => {
                          const selected = draft.guestCity === cityOpt;
                          return (
                            <button
                              key={cityOpt}
                              type="button"
                              onClick={() => updateDraft({ guestCity: cityOpt })}
                              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors min-h-[34px] ${
                                selected
                                  ? 'bg-[#172332] text-[#FAF8F3] border-[#172332]'
                                  : 'bg-white text-[#4F5D6A] border-[#172332]/15 hover:text-[#172332]'
                              }`}
                            >
                              {cityOpt}
                            </button>
                          );
                        })}
                      </div>

                      <input
                        id="res-guest-city"
                        type="text"
                        maxLength={80}
                        value={draft.guestCity}
                        onChange={(e) => updateDraft({ guestCity: e.target.value })}
                        placeholder="Or type your city (e.g. Lahore, Islamabad, London)"
                        className="w-full rounded-xl border border-[#172332]/20 bg-white px-4 py-2.5 text-sm text-[#172332] min-h-[42px]"
                      />
                      <p className="text-xs text-[#4F5D6A] leading-relaxed">
                        All reservations from {draft.guestCity.trim() || 'any city'} are handled at our sole location on{' '}
                        <span className="font-medium text-[#172332]">{RESTAURANT.branch}</span> ({RESTAURANT.phoneDisplay}).
                      </p>
                    </div>

                    {/* Date & Guest Count */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="res-date"
                          className="block text-sm font-medium text-[#172332] mb-1.5"
                        >
                          Preferred Date (Asia/Karachi)
                        </label>
                        <input
                          id="res-date"
                          type="date"
                          min={minDate}
                          value={draft.date}
                          onChange={(e) => {
                            if (e.target.value) updateDraft({ date: e.target.value });
                          }}
                          className="w-full rounded-xl border border-[#172332]/20 bg-[#FAF8F3] px-4 py-3 text-sm text-[#172332] tabular-nums min-h-[44px]"
                        />
                        {fieldErrors.date && (
                          <p className="mt-1.5 text-xs text-[#7E4D54]">{fieldErrors.date}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="res-guests"
                          className="block text-sm font-medium text-[#172332] mb-1.5"
                        >
                          Number of Guests
                        </label>
                        <input
                          id="res-guests"
                          type="number"
                          min={1}
                          step={1}
                          value={guestInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGuestInput(val);
                            const n = parseInt(val, 10);
                            if (!Number.isNaN(n) && n >= 1) {
                              updateDraft({ guests: n });
                            }
                          }}
                          onBlur={() => {
                            const n = parseInt(guestInput, 10);
                            const valid = !Number.isNaN(n) && n >= 1 ? n : 1;
                            updateDraft({ guests: valid });
                            setGuestInput(String(valid));
                          }}
                          className="w-full rounded-xl border border-[#172332]/20 bg-[#FAF8F3] px-4 py-3 text-sm text-[#172332] tabular-nums min-h-[44px]"
                        />
                        {fieldErrors.guests && (
                          <p className="mt-1.5 text-xs text-[#7E4D54]">{fieldErrors.guests}</p>
                        )}
                        {draft.guests > 20 && (
                          <p className="mt-1.5 text-xs text-[#4F5D6A]">
                            Larger groups (corporate hosting is advertised up to 200 across spaces) require direct confirmation from the events team.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Preferred Arrival Time */}
                    {isCustomTimeOccasion ? (
                      <div className="space-y-2.5">
                        <label
                          htmlFor="res-custom-time"
                          className="block text-sm font-medium text-[#172332]"
                        >
                          Preferred Time or Session (Pakistan Time)
                        </label>
                        <input
                          id="res-custom-time"
                          type="text"
                          value={draft.time}
                          onChange={(e) => updateDraft({ time: e.target.value })}
                          placeholder="e.g. 11:00 AM Morning Brunch or 7:30 PM Evening"
                          className="w-full rounded-xl border border-[#172332]/20 bg-[#FAF8F3] px-4 py-3 text-sm text-[#172332] min-h-[44px]"
                        />
                        <div className="flex flex-wrap gap-2">
                          {CUSTOM_OCCASION_TIME_SUGGESTIONS.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => updateDraft({ time: suggestion })}
                              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                                draft.time === suggestion
                                  ? 'bg-[#172332] text-[#FAF8F3] border-[#172332]'
                                  : 'bg-[#FAF8F3] text-[#4F5D6A] border-[#172332]/15 hover:text-[#172332]'
                              }`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-[#4F5D6A]">
                          Private brunch, corporate hosting, and wedding gatherings are planned by confirmation rather than fixed dinner slots.
                        </p>
                        {fieldErrors.time && (
                          <p className="text-xs text-[#7E4D54]">{fieldErrors.time}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <span className="block text-sm font-medium text-[#172332]">
                          Preferred Arrival Time (Pakistan Time)
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {DINNER_TIME_SLOTS.map((slot) => {
                            const disabled = isDinnerSlotPastToday(draft.date, slot.value);
                            const selected = draft.time === slot.value && !disabled;
                            return (
                              <button
                                key={slot.value}
                                type="button"
                                disabled={disabled}
                                onClick={() => updateDraft({ time: slot.value })}
                                className={`rounded-xl border px-4 py-3 text-sm font-medium tabular-nums transition-colors min-h-[44px] ${
                                  disabled
                                    ? 'bg-[#F2EDE3]/50 text-[#4F5D6A]/45 border-[#172332]/10 cursor-not-allowed line-through'
                                    : selected
                                      ? 'bg-[#172332] text-[#FAF8F3] border-[#172332]'
                                      : 'bg-[#FAF8F3] text-[#172332] border-[#172332]/15 hover:border-[#7E4D54]'
                                }`}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                        {allDinnerSlotsPassedToday && (
                          <p className="text-xs text-[#7E4D54]">
                            All evening slots for today in Lahore have passed. Please choose tomorrow or a future date, or call {RESTAURANT.phoneDisplay}.
                          </p>
                        )}
                        {fieldErrors.time && (
                          <p className="text-xs text-[#7E4D54]">{fieldErrors.time}</p>
                        )}
                      </div>
                    )}

                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-6 py-3 text-sm font-medium transition-colors min-h-[44px]"
                      >
                        Continue to Seating & Notes <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2
                        ref={stepHeadingRef}
                        tabIndex={-1}
                        className="font-serif text-3xl font-medium text-[#172332] outline-none"
                      >
                        2. Seating preference & notes
                      </h2>
                      <p className="text-sm text-[#4F5D6A] mt-1">
                        Rooftop or indoor seating is shared as a preference and remains subject to restaurant confirmation.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <span className="block text-sm font-medium text-[#172332]">
                        Optional Seating Preference
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { value: 'rooftop', label: 'Open-Air Rooftop', note: 'Badshahi Masjid view' },
                          { value: 'indoor', label: 'Indoor Dining Room', note: 'Sheltered heritage salon' },
                          { value: 'no-preference', label: 'No Preference', note: 'Best available table' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              updateDraft({
                                seating: opt.value as 'rooftop' | 'indoor' | 'no-preference',
                              })
                            }
                            className={`rounded-xl border p-4 text-left transition-colors ${
                              draft.seating === opt.value
                                ? 'border-[#7E4D54] bg-[#7E4D54]/6 text-[#172332]'
                                : 'border-[#172332]/15 hover:bg-[#FAF8F3] text-[#4F5D6A]'
                            }`}
                          >
                            <span className="block text-sm font-semibold text-[#172332]">
                              {opt.label}
                            </span>
                            <span className="block text-xs mt-1">{opt.note}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="res-notes"
                        className="block text-sm font-medium text-[#172332] mb-1.5"
                      >
                        Occasion, Dietary, or Arrival Notes (Optional)
                      </label>
                      <textarea
                        id="res-notes"
                        rows={4}
                        maxLength={400}
                        value={draft.notes}
                        onChange={(e) => updateDraft({ notes: e.target.value })}
                        placeholder="Share celebration details, live music enquiries, accessibility questions, or allergies for the team to confirm…"
                        className="w-full rounded-xl border border-[#172332]/20 bg-[#FAF8F3] px-4 py-3 text-sm text-[#172332]"
                      />
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#172332]/20 px-5 py-3 text-sm font-medium text-[#172332] hover:bg-[#FAF8F3] min-h-[44px]"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-6 py-3 text-sm font-medium transition-colors min-h-[44px]"
                      >
                        Continue to Your Details <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2
                        ref={stepHeadingRef}
                        tabIndex={-1}
                        className="font-serif text-3xl font-medium text-[#172332] outline-none"
                      >
                        3. Your contact details
                      </h2>
                      <p className="text-sm text-[#4F5D6A] mt-1">
                        Your details are kept strictly in memory for preparing your request and are not saved to browser storage.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="res-name"
                          className="block text-sm font-medium text-[#172332] mb-1.5"
                        >
                          Full Name <span className="text-[#7E4D54]">*</span>
                        </label>
                        <input
                          id="res-name"
                          type="text"
                          autoComplete="name"
                          maxLength={100}
                          value={draft.name}
                          onChange={(e) => updateDraft({ name: e.target.value })}
                          placeholder="e.g. Ali Raza"
                          className="w-full rounded-xl border border-[#172332]/20 bg-[#FAF8F3] px-4 py-3 text-sm text-[#172332] min-h-[44px]"
                        />
                        {fieldErrors.name && (
                          <p className="mt-1.5 text-xs text-[#7E4D54]">{fieldErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="res-phone"
                          className="block text-sm font-medium text-[#172332] mb-1.5"
                        >
                          Mobile / WhatsApp Number <span className="text-[#7E4D54]">*</span>
                        </label>
                        <input
                          id="res-phone"
                          type="tel"
                          autoComplete="tel"
                          maxLength={25}
                          value={draft.phone}
                          onChange={(e) => updateDraft({ phone: e.target.value })}
                          placeholder="e.g. +92 300 1234567 or +44 7700 900123"
                          className="w-full rounded-xl border border-[#172332]/20 bg-[#FAF8F3] px-4 py-3 text-sm text-[#172332] tabular-nums min-h-[44px]"
                        />
                        {fieldErrors.phone && (
                          <p className="mt-1.5 text-xs text-[#7E4D54]">{fieldErrors.phone}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="res-email"
                          className="block text-sm font-medium text-[#172332] mb-1.5"
                        >
                          Email Address (Optional)
                        </label>
                        <input
                          id="res-email"
                          type="email"
                          autoComplete="email"
                          maxLength={120}
                          value={draft.email}
                          onChange={(e) => updateDraft({ email: e.target.value })}
                          placeholder="Optional — only included if you enter it"
                          className="w-full rounded-xl border border-[#172332]/20 bg-[#FAF8F3] px-4 py-3 text-sm text-[#172332] min-h-[44px]"
                        />
                        {fieldErrors.email && (
                          <p className="mt-1.5 text-xs text-[#7E4D54]">{fieldErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => goToStep(2)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#172332]/20 px-5 py-3 text-sm font-medium text-[#172332] hover:bg-[#FAF8F3] min-h-[44px]"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      <button
                        type="button"
                        disabled={submittingRequest}
                        onClick={handleNext}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] disabled:opacity-60 text-[#FAF8F3] px-6 py-3 text-sm font-medium transition-colors min-h-[44px]"
                      >
                        {submittingRequest ? 'Recording Request…' : 'Review Prepared Request'}{' '}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4 */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2
                        ref={stepHeadingRef}
                        tabIndex={-1}
                        className="font-serif text-3xl font-medium text-[#172332] outline-none"
                      >
                        4. Review & continue to WhatsApp
                      </h2>
                      <p className="text-sm text-[#4F5D6A] mt-1">
                        Check your prepared message below. Opening WhatsApp lets you press Send directly inside WhatsApp; your table is only confirmed once the restaurant replies.
                      </p>
                    </div>

                    {lastSubmittedRef && (
                      <div
                        role="status"
                        className="rounded-xl bg-[#F2EDE3] border border-[#172332]/15 px-4 py-3 text-xs text-[#172332] space-y-1"
                      >
                        <p className="font-semibold">
                          Request Logged (Status: Pending) · Reference{' '}
                          <span className="font-mono tabular-nums text-[#7E4D54]">
                            {lastSubmittedRef}
                          </span>
                        </p>
                        <p className="text-[#4F5D6A]">
                          Your enquiry is recorded for manager review. This reference does not guarantee seating until confirmed by the restaurant team.
                        </p>
                      </div>
                    )}

                    {/* Message Preview */}
                    <div className="rounded-xl bg-[#FAF8F3] border border-[#172332]/15 p-4 sm:p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-[#7E4D54]">
                          Message Prepared for {RESTAURANT.phoneDisplay}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy('whatsapp')}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#172332] hover:text-[#7E4D54]"
                        >
                          {copiedMessage ? (
                            <>
                              <Check className="h-3.5 w-3.5" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" /> Copy request
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-sm text-[#172332] leading-relaxed">
                        {whatsappMessage}
                      </pre>
                    </div>

                    {/* Primary WhatsApp Handoff */}
                    <div className="space-y-3">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setWhatsappOpened(true)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-6 py-3.5 text-sm font-medium transition-colors min-h-[48px]"
                      >
                        Continue on WhatsApp <ExternalLink className="h-4 w-4" />
                      </a>

                      {whatsappOpened && (
                        <div
                          role="status"
                          className="rounded-xl bg-[#F2EDE3] border border-[#172332]/15 p-4 text-sm text-[#172332]"
                        >
                          Continue in WhatsApp to send your request. Your reservation is subject to confirmation from the restaurant.
                        </div>
                      )}
                    </div>

                    {/* Secondary & Fallback Routes */}
                    <div className="pt-4 border-t border-[#172332]/10 space-y-3">
                      <p className="text-xs text-[#4F5D6A]">
                        Prefer another route? The official reservation website is separate from this preview, so you can copy your prepared details above and paste them there.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={RESTAURANT.officialReservationPage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-[#172332]/20 bg-white hover:bg-[#F2EDE3] text-[#172332] px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px]"
                        >
                          Use Official Reservation Form <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy('official')}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#172332]/20 bg-white hover:bg-[#F2EDE3] text-[#172332] px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px]"
                        >
                          <Copy className="h-4 w-4" />
                          {copiedOfficial ? 'Details Copied' : 'Copy Details for Official Form'}
                        </button>
                        <a
                          href={`tel:${RESTAURANT.phoneE164}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#172332]/20 bg-white hover:bg-[#F2EDE3] text-[#172332] px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px]"
                        >
                          <Phone className="h-4 w-4" /> Call Restaurant
                        </a>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => goToStep(3)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#4F5D6A] hover:text-[#172332]"
                      >
                        <ArrowLeft className="h-4 w-4" /> Edit Details
                      </button>
                      <button
                        type="button"
                        onClick={resetDraft}
                        className="text-xs text-[#4F5D6A] hover:text-[#7E4D54] underline underline-offset-4"
                      >
                        Clear draft
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Live Editable Summary Sidebar */}
          <aside className="lg:col-span-5">
            <div className="rounded-2xl bg-[#F2EDE3] border border-[#172332]/12 p-6 sm:p-7 space-y-5 lg:sticky lg:top-24">
              <div className="flex items-center justify-between border-b border-[#172332]/10 pb-3">
                <h2 className="font-serif text-2xl font-medium text-[#172332]">
                  Your Request Summary
                </h2>
                <span className="text-xs text-[#4F5D6A]">Subject to confirmation</span>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-[#4F5D6A]">Branch</dt>
                  <dd className="text-right font-medium text-[#172332]">
                    {RESTAURANT.branch}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-[#4F5D6A]">Branch Phone</dt>
                  <dd className="text-right font-medium text-[#7E4D54] tabular-nums">
                    <a href={`tel:${RESTAURANT.phoneE164}`} className="hover:underline">
                      {RESTAURANT.phoneDisplay}
                    </a>
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-[#4F5D6A]">Enquiring City</dt>
                  <dd className="text-right font-medium text-[#172332]">
                    {draft.guestCity.trim() || 'Not specified'}
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      aria-label="Edit enquiry city"
                      className="ml-2 text-[#7E4D54] hover:underline inline-flex items-center"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4 pt-2 border-t border-[#172332]/10">
                  <dt className="text-[#4F5D6A]">Request Type</dt>
                  <dd className="text-right font-medium text-[#172332]">
                    {draft.mode === 'occasion' && draft.occasionType
                      ? OCCASION_LABELS[draft.occasionType]
                      : draft.mode === 'occasion'
                        ? 'Hosted Occasion'
                        : 'Dinner Table'}
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      aria-label="Edit visit type"
                      className="ml-2 text-[#7E4D54] hover:underline inline-flex items-center"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-[#4F5D6A]">Date</dt>
                  <dd className="text-right font-medium text-[#172332] tabular-nums">
                    {formatFullDate(draft.date)}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-[#4F5D6A]">Arrival Time</dt>
                  <dd className="text-right font-medium text-[#172332] tabular-nums">
                    {formatTimeDisplay(draft.time) || 'Not selected'}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-[#4F5D6A]">Party Size</dt>
                  <dd className="text-right font-medium text-[#172332] tabular-nums">
                    {draft.guests} {draft.guests === 1 ? 'guest' : 'guests'}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-[#4F5D6A]">Seating Preference</dt>
                  <dd className="text-right font-medium text-[#172332]">
                    {formatSeatingLabel(draft.seating) || 'No preference'}
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      aria-label="Edit seating preference"
                      className="ml-2 text-[#7E4D54] hover:underline inline-flex items-center"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </dd>
                </div>

                {draft.name && (
                  <div className="flex items-start justify-between gap-4 pt-2 border-t border-[#172332]/10">
                    <dt className="text-[#4F5D6A]">Guest Name</dt>
                    <dd className="text-right font-medium text-[#172332] break-words max-w-[60%]">
                      {draft.name}
                      <button
                        type="button"
                        onClick={() => goToStep(3)}
                        aria-label="Edit contact details"
                        className="ml-2 text-[#7E4D54] hover:underline inline-flex items-center"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </dd>
                  </div>
                )}

                {draft.phone && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-[#4F5D6A]">Mobile</dt>
                    <dd className="text-right font-medium text-[#172332] tabular-nums">
                      {draft.phone}
                    </dd>
                  </div>
                )}

                {draft.email && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-[#4F5D6A]">Email</dt>
                    <dd className="text-right font-medium text-[#172332] break-all">
                      {draft.email}
                    </dd>
                  </div>
                )}

                {draft.notes && (
                  <div className="pt-2 border-t border-[#172332]/10">
                    <dt className="text-[#4F5D6A] mb-1">Notes</dt>
                    <dd className="text-[#172332] text-xs leading-relaxed break-words">
                      {draft.notes}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="pt-3 border-t border-[#172332]/10 text-xs text-[#4F5D6A] leading-relaxed">
                Andaaz Restaurant · {RESTAURANT.shortAddress} ({RESTAURANT.landmark}) · {RESTAURANT.phoneDisplay}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </motion.div>
  );
}
