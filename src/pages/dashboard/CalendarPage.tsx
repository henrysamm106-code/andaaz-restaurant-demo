import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Plus } from 'lucide-react';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { useDashboard } from '../../context/DashboardContext';
import { ReservationStatusBadge, SourceBadge } from '../../components/dashboard/StatusPill';
import { ReservationDrawer } from '../../components/dashboard/ReservationDrawer';
import { CreateReservationModal } from '../../components/dashboard/CreateReservationModal';
import { addDaysToDateStr } from '../../lib/analytics';
import type { ManagementSeating, ReservationRecord, ReservationStatus } from '../../types/management';
import { Link } from '../../lib/router';

type CalendarViewMode = 'daily' | 'weekly' | 'monthly';

export function CalendarPage() {
  const { snapshot } = useDashboard();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('weekly');
  const [focusDate, setFocusDate] = useState<string>('');
  const [seatingFilter, setSeatingFilter] = useState<'all' | ManagementSeating>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ReservationStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const activeDate = focusDate || snapshot?.karachiToday || '2026-11-25';

  const visibleBookings = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.reservations.filter((r) => {
      if (seatingFilter !== 'all' && r.seatingPreference !== seatingFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [snapshot, seatingFilter, statusFilter]);

  // Detect same date + time collisions among active (non-cancelled/non-rejected) requests
  const conflictKeys = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of visibleBookings) {
      if (r.status === 'cancelled' || r.status === 'rejected' || r.status === 'no_show') continue;
      const key = `${r.reservationDate}|${r.reservationTime}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const flagged = new Set<string>();
    for (const [k, c] of counts.entries()) {
      if (c > 1) flagged.add(k);
    }
    return flagged;
  }, [visibleBookings]);

  const dateColumns = useMemo(() => {
    if (viewMode === 'daily') return [activeDate];
    if (viewMode === 'weekly') {
      return Array.from({ length: 7 }, (_, idx) => addDaysToDateStr(activeDate, idx));
    }
    // Monthly: full calendar month of activeDate
    const [y, m] = activeDate.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return Array.from({ length: daysInMonth }, (_, idx) => {
      const dd = String(idx + 1).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    });
  }, [activeDate, viewMode]);

  const stepPeriod = (direction: -1 | 1) => {
    if (viewMode === 'daily') {
      setFocusDate(addDaysToDateStr(activeDate, direction));
    } else if (viewMode === 'weekly') {
      setFocusDate(addDaysToDateStr(activeDate, direction * 7));
    } else {
      const [y, m] = activeDate.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1 + direction, 1, 12));
      setFocusDate(dt.toISOString().slice(0, 10));
    }
  };

  const selectedReservation: ReservationRecord | null = useMemo(() => {
    if (!snapshot || !selectedId) return null;
    return snapshot.reservations.find((r) => r.id === selectedId) || null;
  }, [snapshot, selectedId]);

  const settings = snapshot?.settings;
  const totalConfiguredCapacity =
    settings && settings.capacityConfigured
      ? (settings.rooftopCapacity || 0) + (settings.indoorCapacity || 0)
      : null;

  return (
    <DashboardShell
      title="Reservation Calendar"
      subtitle="Daily, weekly, and monthly Fort Road table request schedule with conflict highlighting."
      actions={
        <>
          <div className="inline-flex rounded-lg border border-[#172332]/15 bg-white p-0.5 text-xs">
            {(['daily', 'weekly', 'monthly'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize ${
                  viewMode === m ? 'bg-[#172332] text-[#FAF8F3]' : 'text-[#4F5D6A]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-3.5 py-2 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> Add Booking
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Controls & Honest Capacity Notice */}
        <div className="rounded-xl bg-white border border-[#172332]/10 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => stepPeriod(-1)}
              aria-label="Previous period"
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[#172332]/15 bg-[#FAF8F3] hover:bg-[#F2EDE3]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setFocusDate(snapshot?.karachiToday || '')}
              className="rounded-lg border border-[#172332]/15 bg-[#FAF8F3] hover:bg-[#F2EDE3] px-3 py-2 text-xs font-medium"
            >
              Today ({snapshot?.karachiToday})
            </button>
            <button
              type="button"
              onClick={() => stepPeriod(1)}
              aria-label="Next period"
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[#172332]/15 bg-[#FAF8F3] hover:bg-[#F2EDE3]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="ml-2 text-sm font-medium text-[#172332] tabular-nums">
              {viewMode === 'monthly'
                ? activeDate.slice(0, 7)
                : viewMode === 'weekly'
                  ? `${dateColumns[0]} → ${dateColumns[dateColumns.length - 1]}`
                  : activeDate}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={seatingFilter}
              onChange={(e) => setSeatingFilter(e.target.value as 'all' | ManagementSeating)}
              className="rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs"
            >
              <option value="all">All Seating</option>
              <option value="rooftop">Rooftop Terrace</option>
              <option value="indoor">Indoor Salon</option>
              <option value="no-preference">No Preference</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | ReservationStatus)}
              className="rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="seated">Seated</option>
            </select>

            {totalConfiguredCapacity !== null ? (
              <span className="rounded-lg bg-[#F2EDE3] border border-[#172332]/10 px-3 py-2 text-xs text-[#172332] tabular-nums">
                Capacity: {totalConfiguredCapacity} seats
                {settings?.capacityIsSample ? ' (Sample)' : ''}
              </span>
            ) : (
              <Link
                to="/staff-demo/availability"
                className="rounded-lg bg-[#FAF8F3] border border-[#172332]/15 px-3 py-2 text-xs text-[#4F5D6A] hover:text-[#7E4D54]"
              >
                Capacity not configured · Configure
              </Link>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        {viewMode === 'daily' && (
          <div className="rounded-xl bg-white border border-[#172332]/10 p-5 space-y-3">
            <h2 className="font-serif text-xl font-medium text-[#172332] tabular-nums">
              Schedule for {activeDate}
            </h2>
            {(() => {
              const items = visibleBookings
                .filter((r) => r.reservationDate === activeDate)
                .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
              if (items.length === 0) {
                return (
                  <p className="py-8 text-center text-xs text-[#4F5D6A] border border-dashed border-[#172332]/15 rounded-lg">
                    No reservation requests recorded for {activeDate}.
                  </p>
                );
              }
              return (
                <div className="space-y-2.5">
                  {items.map((r) => {
                    const hasConflict = conflictKeys.has(`${r.reservationDate}|${r.reservationTime}`);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedId(r.id)}
                        className="w-full text-left rounded-xl border border-[#172332]/12 bg-[#FAF8F3] hover:bg-[#F2EDE3] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-[#172332] tabular-nums">
                              {r.reservationTime}
                            </span>
                            <span className="text-sm font-medium text-[#172332]">
                              {r.customerName}
                            </span>
                            <ReservationStatusBadge status={r.status} />
                            <SourceBadge source={r.source} />
                            {hasConflict && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 text-[11px] font-medium">
                                <AlertTriangle className="h-3 w-3" /> Overlapping Slot
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#4F5D6A] tabular-nums">
                            {r.bookingReference} · {r.guestCount} guests · {r.seatingPreference}
                            {r.specialOccasion ? ` · ${r.specialOccasion}` : ''}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#7E4D54] shrink-0">
                          Manage →
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {viewMode === 'weekly' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
            {dateColumns.map((day) => {
              const items = visibleBookings
                .filter((r) => r.reservationDate === day)
                .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
              const covers = items
                .filter((r) => ['pending', 'confirmed', 'seated'].includes(r.status))
                .reduce((sum, r) => sum + r.guestCount, 0);
              const pct =
                totalConfiguredCapacity && totalConfiguredCapacity > 0
                  ? Math.min(100, Math.round((covers / totalConfiguredCapacity) * 100))
                  : null;
              const isClosed = settings?.closureDates.includes(day);

              return (
                <div
                  key={day}
                  className="rounded-xl bg-white border border-[#172332]/10 p-3 flex flex-col gap-2.5 min-h-[220px]"
                >
                  <div className="pb-2 border-b border-[#172332]/8">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#172332] tabular-nums">
                        {day}
                      </span>
                      <span className="text-[11px] text-[#4F5D6A] tabular-nums">
                        {covers} covers
                      </span>
                    </div>
                    {isClosed && (
                      <span className="mt-1 inline-block text-[10px] text-[#991B1B] bg-[#FEE2E2] px-1.5 py-0.5 rounded">
                        Marked Closed
                      </span>
                    )}
                    {pct !== null && (
                      <div className="mt-1.5 h-1.5 rounded-full bg-[#172332]/10 overflow-hidden">
                        <div
                          className="h-full bg-[#7E4D54]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {items.length === 0 ? (
                    <p className="text-[11px] text-[#4F5D6A]/70 py-4 text-center">No requests</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedId(r.id)}
                          className="w-full text-left rounded-lg border border-[#172332]/10 bg-[#FAF8F3] hover:bg-[#F2EDE3] p-2 space-y-1 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-semibold text-[#172332] tabular-nums">
                              {r.reservationTime}
                            </span>
                            <ReservationStatusBadge status={r.status} />
                          </div>
                          <p className="text-xs font-medium text-[#172332] truncate">
                            {r.customerName}
                          </p>
                          <p className="text-[11px] text-[#4F5D6A] tabular-nums">
                            {r.guestCount} guests · {r.seatingPreference}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'monthly' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {dateColumns.map((day) => {
              const items = visibleBookings.filter((r) => r.reservationDate === day);
              const pending = items.filter((r) => r.status === 'pending').length;
              const confirmed = items.filter((r) => r.status === 'confirmed').length;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setFocusDate(day);
                    setViewMode('daily');
                  }}
                  className="text-left rounded-xl bg-white border border-[#172332]/10 hover:border-[#7E4D54] p-3 min-h-[96px] flex flex-col justify-between transition-colors"
                >
                  <span className="text-xs font-semibold text-[#172332] tabular-nums">
                    {day.slice(8)}
                  </span>
                  <div className="space-y-0.5 text-[11px] tabular-nums">
                    {items.length === 0 ? (
                      <span className="text-[#4F5D6A]/50">—</span>
                    ) : (
                      <>
                        {pending > 0 && (
                          <span className="block text-[#92400E]">{pending} pending</span>
                        )}
                        {confirmed > 0 && (
                          <span className="block text-[#166534]">{confirmed} confirmed</span>
                        )}
                        {pending === 0 && confirmed === 0 && (
                          <span className="block text-[#4F5D6A]">{items.length} total</span>
                        )}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ReservationDrawer
        reservation={selectedReservation}
        onClose={() => setSelectedId(null)}
      />
      <CreateReservationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultDate={activeDate}
      />
    </DashboardShell>
  );
}
