import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DINNER_TIME_SLOTS, getKarachiTomorrow } from '../../lib/karachiTime';
import { useDashboard } from '../../context/DashboardContext';
import type { ManagementSeating } from '../../types/management';

export function CreateReservationModal({
  open,
  onClose,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}) {
  const { createReservation, busyAction } = useDashboard();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [guestCity, setGuestCity] = useState('Lahore');
  const [reservationDate, setReservationDate] = useState(defaultDate || getKarachiTomorrow());
  const [reservationTime, setReservationTime] = useState('20:00');
  const [guestCount, setGuestCount] = useState('4');
  const [seatingPreference, setSeatingPreference] = useState<ManagementSeating>('rooftop');
  const [specialOccasion, setSpecialOccasion] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const digits = customerPhone.replace(/\D/g, '');
    const count = parseInt(guestCount, 10);

    if (!customerName.trim()) {
      setFormError('Guest name is required.');
      return;
    }
    if (digits.length < 7 || digits.length > 15) {
      setFormError('Enter a valid phone number (7 to 15 digits).');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reservationDate)) {
      setFormError('Valid date is required.');
      return;
    }
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      setFormError('Guest count must be between 1 and 500.');
      return;
    }

    const created = await createReservation({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      guestCity: guestCity.trim() || 'Lahore',
      reservationDate,
      reservationTime: reservationTime.trim() || '20:00',
      guestCount: count,
      seatingPreference,
      specialOccasion: specialOccasion.trim(),
      dietaryRequirements: dietaryRequirements.trim(),
      specialRequests: specialRequests.trim(),
      managerNotes: managerNotes.trim(),
      source: 'manual',
    });

    if (created) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setSpecialOccasion('');
      setDietaryRequirements('');
      setSpecialRequests('');
      setManagerNotes('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#172332]/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Create manual reservation request"
    >
      <div className="bg-[#FAF8F3] border border-[#172332]/15 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#172332]/10">
          <div>
            <h2 className="font-serif text-2xl font-medium text-[#172332]">
              New Manual Reservation
            </h2>
            <p className="text-xs text-[#4F5D6A]">
              Starts with Pending status until explicitly confirmed by management.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[#172332]/15 text-[#172332] hover:bg-[#F2EDE3]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="rounded-xl bg-[#FEE2E2] border border-[#DC2626]/30 px-3.5 py-2.5 text-xs text-[#991B1B]">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#172332] mb-1">
                Guest Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Tariq Mahmood (Demo)"
                className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172332] mb-1">
                Phone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+92 300 0000199"
                className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332] tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#172332] mb-1">
                Date (Asia/Karachi) *
              </label>
              <input
                type="date"
                required
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332] tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172332] mb-1">
                Arrival Slot *
              </label>
              <select
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332] tabular-nums"
              >
                {DINNER_TIME_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label} ({slot.value})
                  </option>
                ))}
                <option value="11:30 AM (Morning Brunch)">11:30 AM (Private Brunch)</option>
                <option value="1:30 PM (Corporate Lunch)">1:30 PM (Corporate Lunch)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172332] mb-1">
                Guests *
              </label>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332] tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#172332] mb-1">
                Seating Preference
              </label>
              <select
                value={seatingPreference}
                onChange={(e) => setSeatingPreference(e.target.value as ManagementSeating)}
                className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332]"
              >
                <option value="rooftop">Rooftop Terrace</option>
                <option value="indoor">Indoor Salon</option>
                <option value="no-preference">No Preference</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172332] mb-1">
                Enquiring City
              </label>
              <input
                type="text"
                value={guestCity}
                onChange={(e) => setGuestCity(e.target.value)}
                className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172332] mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#172332] mb-1">
                Special Occasion
              </label>
              <input
                type="text"
                value={specialOccasion}
                onChange={(e) => setSpecialOccasion(e.target.value)}
                placeholder="e.g. Anniversary Dinner, Corporate"
                className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#172332] mb-1">
                Dietary Notes
              </label>
              <input
                type="text"
                value={dietaryRequirements}
                onChange={(e) => setDietaryRequirements(e.target.value)}
                placeholder="e.g. Mild spice preference"
                className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172332] mb-1">
              Guest Requests
            </label>
            <textarea
              rows={2}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#172332] mb-1">
              Internal Manager Notes
            </label>
            <textarea
              rows={2}
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              className="w-full rounded-lg border border-[#172332]/20 bg-white px-3 py-2 text-sm text-[#172332]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#172332]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#172332]/20 text-xs font-medium text-[#172332] hover:bg-[#F2EDE3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busyAction}
              className="px-4 py-2 rounded-lg bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] text-xs font-medium disabled:opacity-60"
            >
              {busyAction ? 'Saving…' : 'Save Pending Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
