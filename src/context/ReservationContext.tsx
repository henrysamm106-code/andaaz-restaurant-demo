import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  type ReservationDraft,
  getKarachiTomorrow,
  isDatePastInKarachi,
} from '../lib/karachiTime';

interface ReservationContextValue {
  draft: ReservationDraft;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  updateDraft: (patch: Partial<ReservationDraft>) => void;
  resetDraft: () => void;
  hasMeaningfulInput: boolean;
  draftEventKey: string;
  lastSubmittedRef: string | null;
  setLastSubmittedRef: (ref: string | null) => void;
}

function generateDraftEventKey(): string {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createInitialDraft(): ReservationDraft {
  return {
    mode: 'dinner',
    occasionType: '',
    date: getKarachiTomorrow(),
    time: '20:00',
    guests: 2,
    guestCity: 'Lahore',
    seating: 'no-preference',
    notes: '',
    name: '',
    phone: '',
    email: '',
  };
}

const ReservationContext = createContext<ReservationContextValue | null>(null);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  // Draft lives strictly in memory; never persisted to localStorage or analytics.
  const [draft, setDraft] = useState<ReservationDraft>(createInitialDraft);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [draftEventKey, setDraftEventKey] = useState<string>(generateDraftEventKey);
  const [lastSubmittedRef, setLastSubmittedRef] = useState<string | null>(null);

  const updateDraft = useCallback((patch: Partial<ReservationDraft>) => {
    setDraft((prev) => {
      const next: ReservationDraft = { ...prev, ...patch };
      // If switching to private brunch and time is a default evening slot, clear or keep clean
      if (patch.occasionType === 'private-brunch' && ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].includes(next.time) && !patch.time) {
        next.time = '11:00 AM (Morning Brunch)';
      }
      // If switching back to ordinary dinner and time is not one of the dinner slots, reset to 20:00
      if (patch.mode === 'dinner' && !['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].includes(next.time) && !patch.time) {
        next.time = '20:00';
      }
      if (next.date && isDatePastInKarachi(next.date)) {
        next.date = prev.date;
      }
      if (typeof next.guests === 'number' && (Number.isNaN(next.guests) || next.guests < 1)) {
        next.guests = 1;
      }
      return next;
    });
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(createInitialDraft());
    setDraftEventKey(generateDraftEventKey());
    setLastSubmittedRef(null);
    setCurrentStep(1);
  }, []);

  const hasMeaningfulInput = useMemo(() => {
    return Boolean(
      draft.name.trim() ||
        draft.phone.trim() ||
        draft.email.trim() ||
        draft.notes.trim() ||
        draft.occasionType !== ''
    );
  }, [draft]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasMeaningfulInput) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasMeaningfulInput]);

  return (
    <ReservationContext.Provider
      value={{
        draft,
        currentStep,
        setCurrentStep,
        updateDraft,
        resetDraft,
        hasMeaningfulInput,
        draftEventKey,
        lastSubmittedRef,
        setLastSubmittedRef,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservationDraft() {
  const ctx = useContext(ReservationContext);
  if (!ctx) {
    throw new Error('useReservationDraft must be used within ReservationProvider');
  }
  return ctx;
}
