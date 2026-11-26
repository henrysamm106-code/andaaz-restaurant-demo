import React, { useEffect, useState } from 'react';
import { Save, Sparkles, RotateCcw } from 'lucide-react';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { useDashboard } from '../../context/DashboardContext';

const ALL_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function AvailabilitySettingsPage() {
  const { snapshot, updateSettings, busyAction } = useDashboard();
  const [operatingDays, setOperatingDays] = useState<string[]>([]);
  const [hoursConfigured, setHoursConfigured] = useState(false);
  const [openingTime, setOpeningTime] = useState('17:00');
  const [closingTime, setClosingTime] = useState('23:30');
  const [timeSlotsText, setTimeSlotsText] = useState('17:00, 18:00, 19:00, 20:00, 21:00, 22:00');
  const [durationMins, setDurationMins] = useState('90');
  const [capacityConfigured, setCapacityConfigured] = useState(false);
  const [capacityIsSample, setCapacityIsSample] = useState(false);
  const [rooftopCap, setRooftopCap] = useState('');
  const [indoorCap, setIndoorCap] = useState('');
  const [maxGuestCount, setMaxGuestCount] = useState('');
  const [closureDatesText, setClosureDatesText] = useState('');
  const [requireManagerApproval, setRequireManagerApproval] = useState(true);

  useEffect(() => {
    if (!snapshot) return;
    const s = snapshot.settings;
    setOperatingDays(s.operatingDays);
    setHoursConfigured(s.hoursConfigured);
    setOpeningTime(s.openingTime || '17:00');
    setClosingTime(s.closingTime || '23:30');
    setTimeSlotsText(s.timeSlots.join(', '));
    setDurationMins(String(s.reservationDurationMinutes));
    setCapacityConfigured(s.capacityConfigured);
    setCapacityIsSample(s.capacityIsSample);
    setRooftopCap(s.rooftopCapacity !== null ? String(s.rooftopCapacity) : '');
    setIndoorCap(s.indoorCapacity !== null ? String(s.indoorCapacity) : '');
    setMaxGuestCount(s.maxGuestCount !== null ? String(s.maxGuestCount) : '');
    setClosureDatesText(s.closureDates.join(', '));
    setRequireManagerApproval(s.requireManagerApproval);
  }, [snapshot]);

  const toggleDay = (day: string) => {
    setOperatingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const slots = timeSlotsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const closures = closureDatesText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));

    await updateSettings({
      operatingDays,
      hoursConfigured,
      openingTime: hoursConfigured ? openingTime : null,
      closingTime: hoursConfigured ? closingTime : null,
      timeSlots: slots,
      reservationDurationMinutes: parseInt(durationMins, 10) || 90,
      capacityConfigured,
      capacityIsSample: capacityConfigured ? capacityIsSample : false,
      rooftopCapacity: capacityConfigured && rooftopCap ? parseInt(rooftopCap, 10) : null,
      indoorCapacity: capacityConfigured && indoorCap ? parseInt(indoorCap, 10) : null,
      maxGuestCount: maxGuestCount ? parseInt(maxGuestCount, 10) : null,
      closureDates: closures,
      requireManagerApproval,
    });
  };

  const applySampleDemoRules = async () => {
    await updateSettings({
      operatingDays: ALL_DAYS,
      hoursConfigured: true,
      openingTime: '17:00',
      closingTime: '23:30',
      capacityConfigured: true,
      capacityIsSample: true,
      rooftopCapacity: 80,
      indoorCapacity: 60,
      maxGuestCount: 20,
      requireManagerApproval: true,
    });
  };

  const resetToVerifiedDefaults = async () => {
    await updateSettings({
      operatingDays: [],
      hoursConfigured: false,
      openingTime: null,
      closingTime: null,
      capacityConfigured: false,
      capacityIsSample: false,
      rooftopCapacity: null,
      indoorCapacity: null,
      maxGuestCount: null,
      requireManagerApproval: true,
    });
  };

  return (
    <DashboardShell
      title="Availability Settings"
      subtitle="Control advisory schedules, slot options, closures, and manager approval rules exposed to /api/integrations/n8n/availability."
      actions={
        <>
          <button
            type="button"
            disabled={busyAction}
            onClick={applySampleDemoRules}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#7E4D54]/30 bg-white hover:bg-[#FAF8F3] text-[#7E4D54] px-3 py-2 text-xs font-medium"
          >
            <Sparkles className="h-3.5 w-3.5" /> Apply Sample Demo Capacities
          </button>
          <button
            type="button"
            disabled={busyAction}
            onClick={resetToVerifiedDefaults}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#172332]/20 bg-white hover:bg-[#F2EDE3] text-[#172332] px-3 py-2 text-xs font-medium"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restore Unconfigured Defaults
          </button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Honesty Banner */}
        <div className="rounded-xl bg-[#F2EDE3] border border-[#172332]/12 p-4 text-xs text-[#172332] space-y-1">
          <p className="font-semibold">
            Verified Truthfulness Guardrail Active
          </p>
          <p className="text-[#4F5D6A] leading-relaxed">
            Weekly opening hours and table capacities are unverified in Andaaz Restaurant&apos;s public factsheet, so they start unconfigured by default. You can enter exact house figures below or apply clearly labeled Sample Demo values for client demonstrations.
          </p>
        </div>

        {/* Operating Hours */}
        <section className="rounded-xl bg-white border border-[#172332]/10 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-medium text-[#172332]">
                Operating Days &amp; Hours (Asia/Karachi)
              </h2>
              <p className="text-xs text-[#4F5D6A]">
                Used by n8n availability checks and After-Hours analytics.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#172332] cursor-pointer">
              <input
                type="checkbox"
                checked={hoursConfigured}
                onChange={(e) => setHoursConfigured(e.target.checked)}
                className="rounded border-[#172332]/30"
              />
              Hours Configured
            </label>
          </div>

          {hoursConfigured && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => {
                  const active = operatingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                        active
                          ? 'bg-[#172332] text-white border-[#172332]'
                          : 'bg-[#FAF8F3] text-[#4F5D6A] border-[#172332]/15'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                <div>
                  <label className="block text-xs font-medium text-[#172332] mb-1">
                    Opening Time (PKT)
                  </label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="w-full rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#172332] mb-1">
                    Closing Time (PKT)
                  </label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    className="w-full rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Time Slots & Closures */}
        <section className="rounded-xl bg-white border border-[#172332]/10 p-5 space-y-4">
          <h2 className="font-serif text-xl font-medium text-[#172332]">
            Dinner Slots &amp; Blackout Dates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#172332] mb-1">
                Evening Arrival Slots (comma-separated, 24h PKT)
              </label>
              <input
                type="text"
                value={timeSlotsText}
                onChange={(e) => setTimeSlotsText(e.target.value)}
                className="w-full rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172332] mb-1">
                Advisory Seating Duration (mins)
              </label>
              <input
                type="number"
                min={30}
                max={360}
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                className="w-full rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172332] mb-1">
              Special Closure Dates (comma-separated YYYY-MM-DD)
            </label>
            <input
              type="text"
              value={closureDatesText}
              onChange={(e) => setClosureDatesText(e.target.value)}
              placeholder="e.g. 2026-12-25, 2027-01-01"
              className="w-full rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs tabular-nums"
            />
          </div>
        </section>

        {/* Seating Capacity & Manager Approval */}
        <section className="rounded-xl bg-white border border-[#172332]/10 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-medium text-[#172332]">
                Dining Room Capacities &amp; Approval Policy
              </h2>
              <p className="text-xs text-[#4F5D6A]">
                When capacity is unconfigured, the calendar refrains from estimating occupancy %.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#172332] cursor-pointer">
              <input
                type="checkbox"
                checked={capacityConfigured}
                onChange={(e) => {
                  setCapacityConfigured(e.target.checked);
                  if (e.target.checked) setCapacityIsSample(false);
                }}
                className="rounded border-[#172332]/30"
              />
              Capacity Configured
            </label>
          </div>

          {capacityConfigured && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#172332] mb-1">
                  Rooftop Capacity (covers)
                </label>
                <input
                  type="number"
                  min={1}
                  value={rooftopCap}
                  onChange={(e) => {
                    setRooftopCap(e.target.value);
                    setCapacityIsSample(false);
                  }}
                  className="w-full rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#172332] mb-1">
                  Indoor Capacity (covers)
                </label>
                <input
                  type="number"
                  min={1}
                  value={indoorCap}
                  onChange={(e) => {
                    setIndoorCap(e.target.value);
                    setCapacityIsSample(false);
                  }}
                  className="w-full rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#172332] mb-1">
                  Standard Table Max Party
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxGuestCount}
                  onChange={(e) => setMaxGuestCount(e.target.value)}
                  className="w-full rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs tabular-nums"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-[#172332]/8 flex items-center justify-between gap-4">
            <div className="text-xs">
              <p className="font-medium text-[#172332]">
                Require Manager Confirmation for Every Request
              </p>
              <p className="text-[#4F5D6A]">
                All inbound website, manual, and n8n WhatsApp AI reservations start as Pending.
              </p>
            </div>
            <input
              type="checkbox"
              checked={requireManagerApproval}
              onChange={(e) => setRequireManagerApproval(e.target.checked)}
              aria-label="Require manager confirmation"
              className="h-4 w-4"
            />
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busyAction}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-5 py-2.5 text-xs font-medium"
          >
            <Save className="h-3.5 w-3.5" /> {busyAction ? 'Saving…' : 'Save Availability Settings'}
          </button>
        </div>
      </form>
    </DashboardShell>
  );
}
