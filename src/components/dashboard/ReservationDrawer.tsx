import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  CalendarClock,
  RefreshCw,
  X,
  MessageSquare,
  Save,
} from 'lucide-react';
import type {
  ManagementSeating,
  ReservationRecord,
  ReservationStatus,
} from '../../types/management';
import { useDashboard } from '../../context/DashboardContext';
import { ReservationStatusBadge, SourceBadge } from './StatusPill';
import { DINNER_TIME_SLOTS } from '../../lib/karachiTime';
import { Link } from '../../lib/router';

export function ReservationDrawer({
  reservation,
  onClose,
}: {
  reservation: ReservationRecord | null;
  onClose: () => void;
}) {
  const { snapshot, updateReservation, retryNotification, busyAction } = useDashboard();
  const [managerNotes, setManagerNotes] = useState('');
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editGuests, setEditGuests] = useState('2');
  const [editSeating, setEditSeating] = useState<ManagementSeating>('no-preference');

  useEffect(() => {
    if (reservation) {
      setManagerNotes(reservation.managerNotes || '');
      setEditDate(reservation.reservationDate);
      setEditTime(reservation.reservationTime);
      setEditGuests(String(reservation.guestCount));
      setEditSeating(reservation.seatingPreference);
      setRescheduleMode(false);
    }
  }, [reservation]);

  if (!reservation) return null;

  const linkedConversation = snapshot?.conversations.find(
    (c) =>
      c.id === reservation.conversationId ||
      c.linkedReservationId === reservation.id ||
      c.linkedBookingReference === reservation.bookingReference
  );

  const handleStatusChange = async (nextStatus: ReservationStatus, note?: string) => {
    await updateReservation(reservation.id, {
      status: nextStatus,
      managerNotes,
      actionNote: note || `Manager marked as ${nextStatus}`,
    });
  };

  const handleSaveNotes = async () => {
    await updateReservation(reservation.id, {
      managerNotes,
      actionNote: 'Updated manager notes',
    });
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(editGuests, 10);
    if (!Number.isInteger(count) || count < 1) return;
    await updateReservation(reservation.id, {
      reservationDate: editDate,
      reservationTime: editTime,
      guestCount: count,
      seatingPreference: editSeating,
      managerNotes,
      actionNote: `Rescheduled / edited to ${editDate} ${editTime} (${count} guests)`,
    });
    setRescheduleMode(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#172332]/40 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Reservation ${reservation.bookingReference}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full bg-[#FAF8F3] border-l border-[#172332]/15 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="px-6 py-4 bg-white border-b border-[#172332]/10 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold text-[#172332] tabular-nums">
                {reservation.bookingReference}
              </span>
              <ReservationStatusBadge status={reservation.status} />
              <SourceBadge source={reservation.source} />
            </div>
            <h2 className="font-serif text-2xl font-medium text-[#172332] truncate mt-1">
              {reservation.customerName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-[#172332]/15 text-[#172332] hover:bg-[#F2EDE3]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Primary Manager Decisions */}
          <div className="bg-white rounded-xl border border-[#172332]/10 p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-wider font-medium text-[#4F5D6A]">
              Manager Decision Controls
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyAction || reservation.status === 'confirmed'}
                onClick={() => handleStatusChange('confirmed', 'Confirmed by management')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#166534] hover:bg-[#14532D] disabled:opacity-45 text-white px-3 py-2 text-xs font-medium whitespace-nowrap"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve &amp; Confirm
              </button>
              <button
                type="button"
                disabled={busyAction || reservation.status === 'rejected'}
                onClick={() => handleStatusChange('rejected', 'Rejected due to capacity or closure')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-45 text-white px-3 py-2 text-xs font-medium whitespace-nowrap"
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
              <button
                type="button"
                disabled={busyAction}
                onClick={() => setRescheduleMode((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#172332]/20 bg-[#FAF8F3] hover:bg-[#F2EDE3] text-[#172332] px-3 py-2 text-xs font-medium whitespace-nowrap"
              >
                <CalendarClock className="h-3.5 w-3.5" /> {rescheduleMode ? 'Cancel Edit' : 'Reschedule / Edit'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#172332]/8">
              {(['seated', 'completed', 'cancelled', 'no_show'] as ReservationStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={busyAction || reservation.status === st}
                  onClick={() => handleStatusChange(st)}
                  className="rounded-lg border border-[#172332]/15 bg-white hover:bg-[#F2EDE3] disabled:opacity-40 text-[#172332] px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap capitalize"
                >
                  Mark {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Inline Reschedule / Edit Form */}
          {rescheduleMode && (
            <form
              onSubmit={handleSaveReschedule}
              className="bg-white rounded-xl border border-[#7E4D54]/30 p-4 space-y-3"
            >
              <p className="text-xs font-semibold text-[#7E4D54]">Edit Booking Schedule &amp; Seating</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#4F5D6A] mb-1">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-lg border border-[#172332]/20 px-2.5 py-1.5 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#4F5D6A] mb-1">Arrival Time</label>
                  <select
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full rounded-lg border border-[#172332]/20 px-2.5 py-1.5 text-xs tabular-nums"
                  >
                    {DINNER_TIME_SLOTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label} ({s.value})
                      </option>
                    ))}
                    {!DINNER_TIME_SLOTS.some((s) => s.value === editTime) && (
                      <option value={editTime}>{editTime}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#4F5D6A] mb-1">Guests</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={editGuests}
                    onChange={(e) => setEditGuests(e.target.value)}
                    className="w-full rounded-lg border border-[#172332]/20 px-2.5 py-1.5 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#4F5D6A] mb-1">Seating</label>
                  <select
                    value={editSeating}
                    onChange={(e) => setEditSeating(e.target.value as ManagementSeating)}
                    className="w-full rounded-lg border border-[#172332]/20 px-2.5 py-1.5 text-xs"
                  >
                    <option value="rooftop">Rooftop Terrace</option>
                    <option value="indoor">Indoor Salon</option>
                    <option value="no-preference">No Preference</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={busyAction}
                  className="rounded-lg bg-[#172332] text-white px-3.5 py-1.5 text-xs font-medium"
                >
                  Save Schedule Changes
                </button>
              </div>
            </form>
          )}

          {/* Guest & Visit Metadata */}
          <div className="bg-white rounded-xl border border-[#172332]/10 p-4">
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
              <div>
                <dt className="text-[#4F5D6A]">Phone</dt>
                <dd className="font-medium text-[#172332] tabular-nums mt-0.5">
                  {reservation.customerPhone}
                </dd>
              </div>
              <div>
                <dt className="text-[#4F5D6A]">Email</dt>
                <dd className="font-medium text-[#172332] break-all mt-0.5">
                  {reservation.customerEmail || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[#4F5D6A]">Date &amp; Time (PKT)</dt>
                <dd className="font-medium text-[#172332] tabular-nums mt-0.5">
                  {reservation.reservationDate} · {reservation.reservationTime}
                </dd>
              </div>
              <div>
                <dt className="text-[#4F5D6A]">Guests &amp; Seating</dt>
                <dd className="font-medium text-[#172332] mt-0.5 capitalize">
                  {reservation.guestCount} guests · {reservation.seatingPreference}
                </dd>
              </div>
              <div>
                <dt className="text-[#4F5D6A]">Enquiring City</dt>
                <dd className="font-medium text-[#172332] mt-0.5">
                  {reservation.guestCity || 'Lahore'}
                </dd>
              </div>
              <div>
                <dt className="text-[#4F5D6A]">Special Occasion</dt>
                <dd className="font-medium text-[#172332] mt-0.5">
                  {reservation.specialOccasion || 'Standard Dinner'}
                </dd>
              </div>
            </dl>

            {(reservation.dietaryRequirements || reservation.specialRequests) && (
              <div className="mt-4 pt-3 border-t border-[#172332]/10 space-y-2 text-xs">
                {reservation.dietaryRequirements && (
                  <p>
                    <span className="font-medium text-[#172332]">Dietary: </span>
                    <span className="text-[#4F5D6A]">{reservation.dietaryRequirements}</span>
                  </p>
                )}
                {reservation.specialRequests && (
                  <p>
                    <span className="font-medium text-[#172332]">Requests: </span>
                    <span className="text-[#4F5D6A]">{reservation.specialRequests}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Outbound n8n Webhook Status */}
          <div className="bg-white rounded-xl border border-[#172332]/10 p-4 flex items-center justify-between gap-3">
            <div className="text-xs space-y-0.5">
              <p className="font-medium text-[#172332]">Outbound n8n Notification Status</p>
              <p className="text-[#4F5D6A] capitalize">
                State: {reservation.lastOutboundNotificationStatus.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              type="button"
              disabled={busyAction}
              onClick={() => retryNotification(reservation.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#172332]/20 bg-[#FAF8F3] hover:bg-[#F2EDE3] text-[#172332] px-3 py-1.5 text-xs font-medium whitespace-nowrap"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry Webhook
            </button>
          </div>

          {/* Manager Notes */}
          <div className="bg-white rounded-xl border border-[#172332]/10 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="drawer-mgr-notes" className="text-xs font-medium text-[#172332]">
                Internal Manager Notes
              </label>
              <button
                type="button"
                disabled={busyAction}
                onClick={handleSaveNotes}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#7E4D54] hover:underline"
              >
                <Save className="h-3.5 w-3.5" /> Save Notes
              </button>
            </div>
            <textarea
              id="drawer-mgr-notes"
              rows={3}
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              placeholder="Add table assignment plan, VIP notes, or follow-up reminder…"
              className="w-full rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs text-[#172332]"
            />
          </div>

          {/* Linked AI Conversation */}
          {linkedConversation && (
            <div className="bg-white rounded-xl border border-[#172332]/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[#172332] flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-[#7E4D54]" />
                  Linked AI Conversation ({linkedConversation.messages.length} msgs)
                </p>
                <Link
                  to="/staff-demo/ai-concierge"
                  className="text-xs font-medium text-[#7E4D54] hover:underline"
                >
                  Open in Concierge
                </Link>
              </div>
              <p className="text-xs text-[#4F5D6A]">
                Intent: {linkedConversation.detectedIntent} · Status: {linkedConversation.status.replace(/_/g, ' ')}
              </p>
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-white rounded-xl border border-[#172332]/10 p-4 space-y-3">
            <p className="text-xs font-medium text-[#172332]">Status Audit Timeline</p>
            <ol className="space-y-2.5 text-xs">
              {reservation.statusHistory
                .slice()
                .reverse()
                .map((entry, idx) => (
                  <li
                    key={`${entry.changedAt}-${idx}`}
                    className="flex items-start justify-between gap-3 pb-2 border-b border-[#172332]/6 last:border-0 last:pb-0"
                  >
                    <div>
                      <span className="font-medium text-[#172332] capitalize">
                        {entry.status.replace('_', ' ')}
                      </span>
                      <span className="text-[#4F5D6A]"> · {entry.actor}</span>
                      {entry.note && (
                        <p className="text-[#4F5D6A] mt-0.5">{entry.note}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-[#4F5D6A] tabular-nums shrink-0">
                      {new Date(entry.changedAt).toLocaleString('en-GB', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
