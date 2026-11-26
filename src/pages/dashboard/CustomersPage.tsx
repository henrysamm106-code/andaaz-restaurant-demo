import React, { useMemo, useState } from 'react';
import { Search, Save, UserCheck } from 'lucide-react';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { useDashboard } from '../../context/DashboardContext';
import { ReservationStatusBadge } from '../../components/dashboard/StatusPill';
import type { CustomerRecord } from '../../types/management';

export function CustomersPage() {
  const { snapshot, globalSearch, setGlobalSearch, updateCustomerNotes, busyAction } = useDashboard();
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [dietaryDraft, setDietaryDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const enrichedCustomers = useMemo(() => {
    if (!snapshot) return [];
    const q = globalSearch.trim().toLowerCase();
    return snapshot.customers
      .map((c) => {
        const bookings = snapshot.reservations.filter((r) => r.customerId === c.id);
        const convs = snapshot.conversations.filter((cv) => cv.customerId === c.id);
        const confirmedCount = bookings.filter((r) => r.status === 'confirmed').length;
        const completedCount = bookings.filter((r) => r.status === 'completed').length;
        const cancelledCount = bookings.filter(
          (r) => r.status === 'cancelled' || r.status === 'rejected'
        ).length;
        return {
          customer: c,
          bookings,
          convs,
          totalRequests: bookings.length,
          confirmedCount,
          completedCount,
          cancelledCount,
        };
      })
      .filter(({ customer }) => {
        if (!q) return true;
        return [
          customer.fullName,
          customer.phoneDisplay,
          customer.phoneNormalized,
          customer.email,
          customer.previousOccasions.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.totalRequests - a.totalRequests);
  }, [snapshot, globalSearch]);

  const activeEntry = useMemo(() => {
    if (enrichedCustomers.length === 0) return null;
    const found =
      enrichedCustomers.find((e) => e.customer.id === selectedCustId) || enrichedCustomers[0];
    return found;
  }, [enrichedCustomers, selectedCustId]);

  const selectCustomer = (c: CustomerRecord) => {
    setSelectedCustId(c.id);
    setEditingId(c.id);
    setNotesDraft(c.internalNotes || '');
    setDietaryDraft(c.dietaryRequirements || '');
  };

  // Sync draft when initial customer auto-selects
  const currentNotes =
    activeEntry && editingId === activeEntry.customer.id
      ? notesDraft
      : activeEntry?.customer.internalNotes || '';
  const currentDietary =
    activeEntry && editingId === activeEntry.customer.id
      ? dietaryDraft
      : activeEntry?.customer.dietaryRequirements || '';

  return (
    <DashboardShell
      title="Customer Records"
      subtitle="Deduplicated guest directory aggregated by normalized mobile number across website, WhatsApp AI, and manual enquiries."
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-white border border-[#172332]/10 p-3 flex items-center gap-3 max-w-md">
          <Search className="h-4 w-4 text-[#4F5D6A]" />
          <input
            type="search"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Filter guests by name, phone, email, or occasion…"
            className="flex-1 text-xs text-[#172332] bg-transparent focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Customer Directory */}
          <div className="lg:col-span-7 rounded-xl bg-white border border-[#172332]/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#172332]/10 bg-[#FAF8F3] text-[11px] uppercase tracking-wider text-[#4F5D6A]">
                    <th className="py-3 px-4 font-medium">Guest</th>
                    <th className="py-3 px-4 font-medium">Phone</th>
                    <th className="py-3 px-4 font-medium">Requests</th>
                    <th className="py-3 px-4 font-medium">Confirmed / Done</th>
                    <th className="py-3 px-4 font-medium">Preference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172332]/8 text-xs">
                  {enrichedCustomers.map((entry) => {
                    const isSelected = activeEntry?.customer.id === entry.customer.id;
                    return (
                      <tr
                        key={entry.customer.id}
                        onClick={() => selectCustomer(entry.customer)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#F2EDE3]' : 'hover:bg-[#FAF8F3]'
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-[#172332]">
                          {entry.customer.fullName}
                          {entry.totalRequests >= 2 && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-[#9A7B4F]/15 text-[#745932] text-[10px]">
                              Repeat
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 tabular-nums text-[#4F5D6A]">
                          {entry.customer.phoneDisplay}
                        </td>
                        <td className="py-3 px-4 tabular-nums font-medium text-[#172332]">
                          {entry.totalRequests}
                        </td>
                        <td className="py-3 px-4 tabular-nums text-[#4F5D6A]">
                          {entry.confirmedCount} conf · {entry.completedCount} done
                        </td>
                        <td className="py-3 px-4 capitalize text-[#4F5D6A]">
                          {entry.customer.preferredSeating}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Detail Inspector */}
          <div className="lg:col-span-5 rounded-xl bg-white border border-[#172332]/10 p-5 space-y-5">
            {!activeEntry ? (
              <p className="text-xs text-[#4F5D6A] text-center py-8">
                No matching customer records.
              </p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#172332]/10">
                  <div>
                    <h2 className="font-serif text-2xl font-medium text-[#172332]">
                      {activeEntry.customer.fullName}
                    </h2>
                    <p className="text-xs text-[#4F5D6A] tabular-nums mt-0.5">
                      {activeEntry.customer.phoneDisplay}
                      {activeEntry.customer.email ? ` · ${activeEntry.customer.email}` : ''}
                    </p>
                  </div>
                  <UserCheck className="h-5 w-5 text-[#7E4D54]" />
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="rounded-lg bg-[#FAF8F3] border border-[#172332]/10 p-2.5">
                    <span className="block text-lg font-serif font-semibold tabular-nums text-[#172332]">
                      {activeEntry.totalRequests}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[#4F5D6A]">
                      Total Req
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#FAF8F3] border border-[#172332]/10 p-2.5">
                    <span className="block text-lg font-serif font-semibold tabular-nums text-[#166534]">
                      {activeEntry.confirmedCount + activeEntry.completedCount}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[#4F5D6A]">
                      Confirmed/Done
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#FAF8F3] border border-[#172332]/10 p-2.5">
                    <span className="block text-lg font-serif font-semibold tabular-nums text-[#991B1B]">
                      {activeEntry.cancelledCount}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[#4F5D6A]">
                      Cancelled/Rej
                    </span>
                  </div>
                </div>

                {activeEntry.customer.previousOccasions.length > 0 && (
                  <div className="text-xs">
                    <p className="font-medium text-[#172332] mb-1">Occasions</p>
                    <p className="text-[#4F5D6A]">
                      {activeEntry.customer.previousOccasions.join(', ')}
                    </p>
                  </div>
                )}

                {/* Editable Guest Notes */}
                <div className="space-y-3 pt-2 border-t border-[#172332]/10">
                  <div>
                    <label className="block text-xs font-medium text-[#172332] mb-1">
                      Dietary / Allergy Notes
                    </label>
                    <input
                      type="text"
                      value={currentDietary}
                      onFocus={() => {
                        if (editingId !== activeEntry.customer.id) {
                          selectCustomer(activeEntry.customer);
                        }
                      }}
                      onChange={(e) => {
                        setEditingId(activeEntry.customer.id);
                        setDietaryDraft(e.target.value);
                      }}
                      placeholder="e.g. Mild spice, tree-nut allergy"
                      className="w-full rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs text-[#172332]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#172332] mb-1">
                      Internal Hospitality Notes
                    </label>
                    <textarea
                      rows={3}
                      value={currentNotes}
                      onFocus={() => {
                        if (editingId !== activeEntry.customer.id) {
                          selectCustomer(activeEntry.customer);
                        }
                      }}
                      onChange={(e) => {
                        setEditingId(activeEntry.customer.id);
                        setNotesDraft(e.target.value);
                      }}
                      placeholder="Add seating preferences or family hosting notes…"
                      className="w-full rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-3 py-2 text-xs text-[#172332]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() =>
                      updateCustomerNotes(
                        activeEntry.customer.id,
                        currentNotes,
                        currentDietary
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#172332] hover:bg-[#1F2B38] text-white px-3.5 py-2 text-xs font-medium"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Guest Profile
                  </button>
                </div>

                {/* Linked Reservations */}
                <div className="pt-2 border-t border-[#172332]/10 space-y-2">
                  <p className="text-xs font-medium text-[#172332]">
                    Reservation History ({activeEntry.bookings.length})
                  </p>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {activeEntry.bookings.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-[#FAF8F3]"
                      >
                        <span className="tabular-nums text-[#172332]">
                          {b.reservationDate} · {b.guestCount} guests
                        </span>
                        <ReservationStatusBadge status={b.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
