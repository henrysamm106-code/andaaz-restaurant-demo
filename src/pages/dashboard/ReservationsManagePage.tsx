import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { useDashboard } from '../../context/DashboardContext';
import { ReservationStatusBadge, SourceBadge } from '../../components/dashboard/StatusPill';
import { ReservationDrawer } from '../../components/dashboard/ReservationDrawer';
import { CreateReservationModal } from '../../components/dashboard/CreateReservationModal';
import { buildReservationsCsv } from '../../lib/analytics';
import type {
  ManagementSeating,
  ReservationRecord,
  ReservationSource,
  ReservationStatus,
} from '../../types/management';

const PAGE_SIZE = 10;

export function ReservationsManagePage() {
  const { snapshot, globalSearch, setGlobalSearch, updateReservation, busyAction } = useDashboard();
  const [statusFilter, setStatusFilter] = useState<'all' | ReservationStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | ReservationSource>('all');
  const [seatingFilter, setSeatingFilter] = useState<'all' | ManagementSeating>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'created_desc' | 'date_asc' | 'date_desc' | 'guests_desc'>(
    'created_desc'
  );
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!snapshot) return [];
    const q = globalSearch.trim().toLowerCase();
    const list = snapshot.reservations.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
      if (seatingFilter !== 'all' && r.seatingPreference !== seatingFilter) return false;
      if (dateFilter && r.reservationDate !== dateFilter) return false;
      if (q) {
        const hay = [
          r.bookingReference,
          r.customerName,
          r.customerPhone,
          r.customerEmail,
          r.guestCity,
          r.specialOccasion,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'date_asc') {
        return `${a.reservationDate} ${a.reservationTime}`.localeCompare(
          `${b.reservationDate} ${b.reservationTime}`
        );
      }
      if (sortBy === 'date_desc') {
        return `${b.reservationDate} ${b.reservationTime}`.localeCompare(
          `${a.reservationDate} ${a.reservationTime}`
        );
      }
      if (sortBy === 'guests_desc') {
        return b.guestCount - a.guestCount;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [snapshot, globalSearch, statusFilter, sourceFilter, seatingFilter, dateFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectedReservation: ReservationRecord | null = useMemo(() => {
    if (!snapshot || !selectedId) return null;
    return snapshot.reservations.find((r) => r.id === selectedId) || null;
  }, [snapshot, selectedId]);

  const handleExportCsv = () => {
    const csv = buildReservationsCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `andaaz-reservations-${snapshot?.karachiToday || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell
      title="Reservations Management"
      subtitle="Search, filter, approve, reschedule, or log manual reservations across Fort Road dining spaces."
      actions={
        <>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#172332]/20 bg-white hover:bg-[#F2EDE3] text-[#172332] px-3.5 py-2 text-xs font-medium whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
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
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="rounded-xl bg-white border border-[#172332]/10 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="h-3.5 w-3.5 text-[#4F5D6A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search ref, guest, phone, occasion…"
              className="w-full rounded-lg border border-[#172332]/15 bg-[#FAF8F3] pl-8 pr-3 py-2 text-xs text-[#172332]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | ReservationStatus);
              setPage(1);
            }}
            aria-label="Filter by status"
            className="rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs text-[#172332]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="seated">Seated</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as 'all' | ReservationSource);
              setPage(1);
            }}
            aria-label="Filter by source"
            className="rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs text-[#172332]"
          >
            <option value="all">All Sources</option>
            <option value="whatsapp_ai">WhatsApp AI</option>
            <option value="website">Website Form</option>
            <option value="manual">Manual Staff</option>
            <option value="web_ai_demo">Web AI Demo</option>
          </select>

          <select
            value={seatingFilter}
            onChange={(e) => {
              setSeatingFilter(e.target.value as 'all' | ManagementSeating);
              setPage(1);
            }}
            aria-label="Filter by seating"
            className="rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs text-[#172332]"
          >
            <option value="all">All Seating</option>
            <option value="rooftop">Rooftop Terrace</option>
            <option value="indoor">Indoor Salon</option>
            <option value="no-preference">No Preference</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by date"
              className="flex-1 min-w-0 rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-2.5 py-2 text-xs text-[#172332] tabular-nums"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-[11px] text-[#7E4D54] hover:underline shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Result Count & Sort */}
        <div className="flex items-center justify-between text-xs text-[#4F5D6A] px-1">
          <span className="tabular-nums">
            Showing {paginated.length} of {filtered.length} matching requests
          </span>
          <div className="flex items-center gap-2">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-md border border-[#172332]/15 bg-white px-2.5 py-1 text-xs text-[#172332]"
            >
              <option value="created_desc">Newest Submitted</option>
              <option value="date_asc">Upcoming Date First</option>
              <option value="date_desc">Latest Date First</option>
              <option value="guests_desc">Largest Party First</option>
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-xl bg-white border border-[#172332]/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#172332]/10 bg-[#FAF8F3] text-[11px] uppercase tracking-wider text-[#4F5D6A]">
                  <th className="py-3 px-4 font-medium">Ref</th>
                  <th className="py-3 px-4 font-medium">Guest</th>
                  <th className="py-3 px-4 font-medium">Visit (PKT)</th>
                  <th className="py-3 px-4 font-medium">Party &amp; Seating</th>
                  <th className="py-3 px-4 font-medium">Source</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#172332]/8 text-xs">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#4F5D6A]">
                      No reservation requests match the active filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((r) => (
                    <tr key={r.id} className="hover:bg-[#FAF8F3]/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] font-medium text-[#172332] tabular-nums whitespace-nowrap">
                        {r.bookingReference}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedId(r.id)}
                          className="text-left group"
                        >
                          <span className="block font-medium text-[#172332] group-hover:text-[#7E4D54]">
                            {r.customerName}
                          </span>
                          <span className="block text-[11px] text-[#4F5D6A] tabular-nums">
                            {r.customerPhone}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                        <span className="block font-medium text-[#172332]">
                          {r.reservationDate}
                        </span>
                        <span className="block text-[11px] text-[#4F5D6A]">
                          {r.reservationTime}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="block font-medium text-[#172332] tabular-nums">
                          {r.guestCount} guests
                        </span>
                        <span className="block text-[11px] text-[#4F5D6A] capitalize">
                          {r.seatingPreference}
                          {r.specialOccasion ? ` · ${r.specialOccasion}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <SourceBadge source={r.source} />
                      </td>
                      <td className="py-3 px-4">
                        <ReservationStatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {r.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                disabled={busyAction}
                                title="Confirm booking"
                                onClick={() =>
                                  updateReservation(r.id, {
                                    status: 'confirmed',
                                    actionNote: 'Approved in Reservations table',
                                  })
                                }
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md bg-[#166534] text-white hover:bg-[#14532D]"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={busyAction}
                                title="Reject booking"
                                onClick={() =>
                                  updateReservation(r.id, {
                                    status: 'rejected',
                                    actionNote: 'Rejected in Reservations table',
                                  })
                                }
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-[#DC2626]/30 text-[#991B1B] hover:bg-[#FEE2E2]"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedId(r.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-[#172332]/15 bg-white hover:bg-[#F2EDE3] px-2.5 py-1 text-[11px] font-medium text-[#172332]"
                          >
                            <Eye className="h-3 w-3" /> Open
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {paginated.length === 0 ? (
            <div className="rounded-xl bg-white border border-[#172332]/10 p-6 text-center text-xs text-[#4F5D6A]">
              No reservation requests match the active filters.
            </div>
          ) : (
            paginated.map((r) => (
              <div
                key={r.id}
                className="rounded-xl bg-white border border-[#172332]/10 p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] text-[#4F5D6A] tabular-nums">
                      {r.bookingReference}
                    </span>
                    <h3 className="text-sm font-semibold text-[#172332]">{r.customerName}</h3>
                    <p className="text-xs text-[#4F5D6A] tabular-nums">{r.customerPhone}</p>
                  </div>
                  <ReservationStatusBadge status={r.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#172332] tabular-nums">
                  <span>{r.reservationDate}</span>
                  <span>·</span>
                  <span>{r.reservationTime}</span>
                  <span>·</span>
                  <span>{r.guestCount} guests</span>
                  <SourceBadge source={r.source} />
                </div>
                <div className="pt-2 border-t border-[#172332]/8 flex items-center justify-between gap-2">
                  {r.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={() => updateReservation(r.id, { status: 'confirmed' })}
                        className="rounded-md bg-[#166534] text-white px-2.5 py-1 text-[11px] font-medium"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={() => updateReservation(r.id, { status: 'rejected' })}
                        className="rounded-md border border-[#DC2626]/30 text-[#991B1B] px-2.5 py-1 text-[11px] font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className="rounded-md border border-[#172332]/15 px-3 py-1 text-[11px] font-medium text-[#172332]"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#4F5D6A] tabular-nums">
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#172332]/15 bg-white px-3 py-1.5 text-xs disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#172332]/15 bg-white px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ReservationDrawer
        reservation={selectedReservation}
        onClose={() => setSelectedId(null)}
      />
      <CreateReservationModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </DashboardShell>
  );
}
