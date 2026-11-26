import React, { useMemo, useState } from 'react';
import {
  Plus,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Bot,
  AlertCircle,
} from 'lucide-react';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { useDashboard } from '../../context/DashboardContext';
import { computeDashboardMetrics, type DateRangePreset } from '../../lib/analytics';
import {
  ActivityByDateChart,
  SourceBreakdownBars,
} from '../../components/dashboard/DashboardCharts';
import {
  ConversationStatusBadge,
  ReservationStatusBadge,
  SourceBadge,
} from '../../components/dashboard/StatusPill';
import { ReservationDrawer } from '../../components/dashboard/ReservationDrawer';
import { CreateReservationModal } from '../../components/dashboard/CreateReservationModal';
import type { ReservationRecord } from '../../types/management';
import { Link } from '../../lib/router';

export function OverviewPage() {
  const { snapshot, updateReservation, busyAction } = useDashboard();
  const [rangePreset, setRangePreset] = useState<DateRangePreset>('all');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const metrics = useMemo(() => {
    if (!snapshot) return null;
    return computeDashboardMetrics(
      snapshot.reservations,
      snapshot.conversations,
      snapshot.customers,
      snapshot.settings,
      snapshot.karachiToday,
      { preset: rangePreset }
    );
  }, [snapshot, rangePreset]);

  const selectedReservation: ReservationRecord | null = useMemo(() => {
    if (!snapshot || !selectedReservationId) return null;
    return snapshot.reservations.find((r) => r.id === selectedReservationId) || null;
  }, [snapshot, selectedReservationId]);

  const upcomingReservations = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.reservations
      .filter(
        (r) =>
          r.reservationDate >= snapshot.karachiToday &&
          ['pending', 'confirmed', 'seated'].includes(r.status)
      )
      .sort((a, b) =>
        `${a.reservationDate} ${a.reservationTime}`.localeCompare(
          `${b.reservationDate} ${b.reservationTime}`
        )
      )
      .slice(0, 6);
  }, [snapshot]);

  const pendingQueue = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.reservations
      .filter((r) => r.status === 'pending')
      .sort((a, b) => a.reservationDate.localeCompare(b.reservationDate))
      .slice(0, 5);
  }, [snapshot]);

  const recentConversations = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.conversations.slice(0, 4);
  }, [snapshot]);

  const recentNotifications = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.notifications.slice(0, 5);
  }, [snapshot]);

  const kpiCards = metrics
    ? [
        {
          label: 'Total Reservations',
          value: String(metrics.totalReservations),
          note: rangePreset === 'all' ? 'All recorded requests' : `Filtered (${rangePreset})`,
        },
        {
          label: "Today's Bookings (PKT)",
          value: String(metrics.todayReservations),
          note: `${metrics.todayGuestsExpected} expected covers`,
        },
        {
          label: 'Pending Approval',
          value: String(metrics.pendingApproval),
          note: 'Awaiting manager decision',
          highlight: metrics.pendingApproval > 0,
        },
        {
          label: 'Confirmed Bookings',
          value: String(metrics.confirmedCount),
          note: 'Explicitly confirmed',
        },
        {
          label: 'Cancelled / Rejected',
          value: String(metrics.cancelledOrRejectedCount),
          note: 'Declined or guest cancelled',
        },
        {
          label: 'AI-Created Bookings',
          value: String(metrics.aiCreatedReservations),
          note: 'WhatsApp AI & Web AI Demo',
        },
        {
          label: 'Website Form Bookings',
          value: String(metrics.websiteReservations),
          note: `${metrics.manualReservations} manual staff entries`,
        },
        {
          label: 'Active AI Conversations',
          value: String(metrics.activeAiConversations),
          note: `${metrics.humanAssistanceCount} need human assistance`,
        },
        {
          label: 'AI Conversion Rate',
          value:
            metrics.aiConversionRate !== null ? `${metrics.aiConversionRate}%` : 'Not enough data',
          note: `${metrics.eligibleAiConversations} eligible conversations`,
        },
        {
          label: 'After-Hours Requests',
          value:
            metrics.afterHoursRequests !== null
              ? String(metrics.afterHoursRequests)
              : 'Unavailable',
          note:
            metrics.afterHoursRequests !== null
              ? 'Based on configured PKT hours'
              : 'Operating hours not configured',
        },
        {
          label: 'Avg AI Response Time',
          value: metrics.avgAiResponseMs !== null ? `${metrics.avgAiResponseMs} ms` : 'Not measured',
          note: 'Measured webhook latency',
        },
        {
          label: 'Repeat Guests',
          value: String(metrics.repeatGuestCount),
          note: '2+ non-cancelled bookings',
        },
      ]
    : [];

  return (
    <DashboardShell
      title="Operations Overview"
      subtitle="Live reservation pipeline, pending manager confirmations, and external n8n WhatsApp AI Concierge monitoring."
      actions={
        <>
          <div className="inline-flex rounded-lg border border-[#172332]/15 bg-white p-0.5 text-xs">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'all', label: 'All' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRangePreset(opt.id)}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  rangePreset === opt.id
                    ? 'bg-[#172332] text-[#FAF8F3]'
                    : 'text-[#4F5D6A] hover:text-[#172332]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-3.5 py-2 text-xs font-medium whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" /> New Reservation
          </button>
        </>
      }
    >
      {snapshot && metrics && (
        <div className="space-y-6">
          {/* 12 Live-Calculated KPI Cards */}
          <section aria-label="Key Operational Metrics" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {kpiCards.map((kpi) => (
              <div
                key={kpi.label}
                className={`rounded-xl bg-white border p-4 space-y-1 ${
                  kpi.highlight ? 'border-[#D97706]/50' : 'border-[#172332]/10'
                }`}
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#4F5D6A]">
                  {kpi.label}
                </p>
                <p className="text-2xl font-serif font-semibold text-[#172332] tabular-nums">
                  {kpi.value}
                </p>
                <p className="text-[11px] text-[#4F5D6A]">{kpi.note}</p>
              </div>
            ))}
          </section>

          {/* Pending Manager Approvals + Upcoming Reservations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Pending Actions Queue */}
            <section className="lg:col-span-6 rounded-xl bg-white border border-[#172332]/10 p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif text-xl font-medium text-[#172332]">
                    Pending Confirmations
                  </h2>
                  <p className="text-xs text-[#4F5D6A]">
                    Requests never auto-confirm; approve or reject below.
                  </p>
                </div>
                <Link
                  to="/staff-demo/reservations"
                  className="text-xs font-medium text-[#7E4D54] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  All Requests <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {pendingQueue.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#172332]/15 p-6 text-center text-xs text-[#4F5D6A]">
                  All reservation requests have been reviewed.
                </div>
              ) : (
                <div className="divide-y divide-[#172332]/8">
                  {pendingQueue.map((res) => (
                    <div
                      key={res.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedReservationId(res.id)}
                        className="text-left min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[#172332] hover:text-[#7E4D54]">
                            {res.customerName}
                          </span>
                          <SourceBadge source={res.source} />
                        </div>
                        <p className="text-xs text-[#4F5D6A] tabular-nums mt-0.5">
                          {res.bookingReference} · {res.reservationDate} at {res.reservationTime} ·{' '}
                          {res.guestCount} guests ({res.seatingPreference})
                        </p>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() =>
                            updateReservation(res.id, {
                              status: 'confirmed',
                              actionNote: 'Approved from Overview queue',
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-[#166534] hover:bg-[#14532D] text-white px-2.5 py-1.5 text-[11px] font-medium"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Confirm
                        </button>
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() =>
                            updateReservation(res.id, {
                              status: 'rejected',
                              actionNote: 'Rejected from Overview queue',
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-[#DC2626]/30 text-[#991B1B] hover:bg-[#FEE2E2] px-2.5 py-1.5 text-[11px] font-medium"
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming Reservations */}
            <section className="lg:col-span-6 rounded-xl bg-white border border-[#172332]/10 p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif text-xl font-medium text-[#172332]">
                    Upcoming Service Schedule
                  </h2>
                  <p className="text-xs text-[#4F5D6A]">
                    Pending, confirmed, and seated tables from today ({snapshot.karachiToday}).
                  </p>
                </div>
                <Link
                  to="/staff-demo/calendar"
                  className="text-xs font-medium text-[#7E4D54] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                >
                  Open Calendar <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {upcomingReservations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#172332]/15 p-6 text-center text-xs text-[#4F5D6A]">
                  No upcoming bookings scheduled.
                </div>
              ) : (
                <div className="divide-y divide-[#172332]/8">
                  {upcomingReservations.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => setSelectedReservationId(res.id)}
                      className="w-full py-2.5 text-left flex items-center justify-between gap-3 hover:bg-[#FAF8F3] px-2 -mx-2 rounded-lg transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#172332] truncate">
                          {res.customerName}
                        </p>
                        <p className="text-xs text-[#4F5D6A] tabular-nums">
                          {res.reservationDate} · {res.reservationTime} · {res.guestCount} guests
                        </p>
                      </div>
                      <ReservationStatusBadge status={res.status} />
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Analytics Visual Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <section className="lg:col-span-7 rounded-xl bg-white border border-[#172332]/10 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-medium text-[#172332]">
                  Reservation Activity by Date
                </h2>
                <span className="text-[11px] text-[#4F5D6A]">Asia/Karachi dates</span>
              </div>
              <ActivityByDateChart data={metrics.byDate} />
            </section>

            <section className="lg:col-span-5 rounded-xl bg-white border border-[#172332]/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-medium text-[#172332]">
                  Requests by Source
                </h2>
                <Link
                  to="/staff-demo/analytics"
                  className="text-xs font-medium text-[#7E4D54] hover:underline"
                >
                  Full Report
                </Link>
              </div>
              <SourceBreakdownBars data={metrics.bySource} />
            </section>
          </div>

          {/* AI Activity & Recent Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <section className="lg:col-span-6 rounded-xl bg-white border border-[#172332]/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-medium text-[#172332] flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#7E4D54]" /> Recent AI Concierge Sessions
                </h2>
                <Link
                  to="/staff-demo/ai-concierge"
                  className="text-xs font-medium text-[#7E4D54] hover:underline"
                >
                  Monitor All
                </Link>
              </div>
              {recentConversations.length === 0 ? (
                <p className="text-xs text-[#4F5D6A]">No AI conversations logged yet.</p>
              ) : (
                <div className="divide-y divide-[#172332]/8">
                  {recentConversations.map((conv) => (
                    <Link
                      key={conv.id}
                      to="/staff-demo/ai-concierge"
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#FAF8F3] px-2 -mx-2 rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#172332] truncate">
                          {conv.customerName}{' '}
                          <span className="text-xs font-normal text-[#4F5D6A] tabular-nums">
                            ({conv.customerIdentifier})
                          </span>
                        </p>
                        <p className="text-xs text-[#4F5D6A] truncate">
                          Intent: {conv.detectedIntent}
                          {conv.responseLatencyMs ? ` · ${conv.responseLatencyMs} ms` : ''}
                        </p>
                      </div>
                      <ConversationStatusBadge status={conv.status} />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="lg:col-span-6 rounded-xl bg-white border border-[#172332]/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-medium text-[#172332] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#7E4D54]" /> Recent Notifications
                </h2>
                <Link
                  to="/staff-demo/notifications"
                  className="text-xs font-medium text-[#7E4D54] hover:underline"
                >
                  Notifications Centre
                </Link>
              </div>
              {recentNotifications.length === 0 ? (
                <p className="text-xs text-[#4F5D6A]">No notifications yet.</p>
              ) : (
                <div className="divide-y divide-[#172332]/8">
                  {recentNotifications.map((n) => (
                    <div key={n.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#172332] flex items-center gap-1.5">
                          {!n.isRead && (
                            <AlertCircle className="h-3 w-3 text-[#7E4D54] shrink-0" />
                          )}
                          {n.title}
                        </p>
                        <p className="text-xs text-[#4F5D6A] truncate mt-0.5">{n.message}</p>
                      </div>
                      <span className="text-[11px] text-[#4F5D6A] tabular-nums shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      <ReservationDrawer
        reservation={selectedReservation}
        onClose={() => setSelectedReservationId(null)}
      />
      <CreateReservationModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </DashboardShell>
  );
}
