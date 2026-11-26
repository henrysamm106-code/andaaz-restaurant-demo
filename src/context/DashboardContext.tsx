import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  ConversationStatus,
  IntegrationStatusSummary,
  ManagementSeating,
  ReservationRecord,
  ReservationSource,
  ReservationStatus,
  RestaurantSettingsRecord,
  WorkspaceSnapshot,
} from '../types/management';

export interface ToastItem {
  id: string;
  tone: 'success' | 'error' | 'info';
  title: string;
  detail?: string;
}

export interface CreateManualReservationInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  guestCity?: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  seatingPreference: ManagementSeating;
  specialOccasion?: string;
  specialRequests?: string;
  dietaryRequirements?: string;
  managerNotes?: string;
  source?: ReservationSource;
}

export interface UpdateReservationInput {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  guestCity?: string;
  reservationDate?: string;
  reservationTime?: string;
  guestCount?: number;
  seatingPreference?: ManagementSeating;
  specialOccasion?: string;
  specialRequests?: string;
  dietaryRequirements?: string;
  status?: ReservationStatus;
  managerNotes?: string;
  actionNote?: string;
}

interface DashboardContextValue {
  snapshot: WorkspaceSnapshot | null;
  loading: boolean;
  error: string | null;
  busyAction: boolean;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
  refreshWorkspace: () => Promise<void>;
  createReservation: (input: CreateManualReservationInput) => Promise<ReservationRecord | null>;
  updateReservation: (id: string, patch: UpdateReservationInput) => Promise<ReservationRecord | null>;
  retryNotification: (id: string) => Promise<ReservationRecord | null>;
  updateConversation: (
    id: string,
    patch: { status?: ConversationStatus; needsHumanAssistance?: boolean }
  ) => Promise<boolean>;
  updateCustomerNotes: (
    id: string,
    internalNotes: string,
    dietaryRequirements?: string
  ) => Promise<boolean>;
  markNotificationRead: (id?: string) => Promise<void>;
  updateSettings: (patch: Partial<RestaurantSettingsRecord>) => Promise<boolean>;
  testIntegrations: () => Promise<IntegrationStatusSummary | null>;
  resetDemoWorkspace: (reseed?: boolean) => Promise<boolean>;
  adminToken: string | null;
  workspaceMode: 'demo' | 'production';
  setWorkspaceMode: (mode: 'demo' | 'production') => void;
  loginAdmin: (passcode: string, isFirstRunClaim?: boolean) => Promise<{ ok: boolean; message?: string }>;
  logoutAdmin: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // Manager auth token lives strictly in React state memory (never localStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<'demo' | 'production'>('demo');

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  const refreshWorkspace = useCallback(async () => {
    setError(null);
    try {
      const isProd = workspaceMode === 'production' && Boolean(adminToken);
      const res = await fetch(isProd ? '/api/admin/workspace' : '/api/demo/workspace', {
        headers: isProd && adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (res.status === 401 && workspaceMode === 'production') {
          setAdminToken(null);
          setWorkspaceMode('demo');
        }
        throw new Error(json.message || 'Unable to load workspace snapshot.');
      }
      setSnapshot(json.snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace data.');
    } finally {
      setLoading(false);
    }
  }, [workspaceMode, adminToken]);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  const createReservation = useCallback(
    async (input: CreateManualReservationInput): Promise<ReservationRecord | null> => {
      setBusyAction(true);
      try {
        const res = await fetch('/api/demo/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerEmail: input.customerEmail || '',
            guestCity: input.guestCity || 'Lahore',
            reservationDate: input.reservationDate,
            reservationTime: input.reservationTime,
            guestCount: input.guestCount,
            seatingPreference: input.seatingPreference,
            specialOccasion: input.specialOccasion || '',
            specialRequests: input.specialRequests || '',
            dietaryRequirements: input.dietaryRequirements || '',
            managerNotes: input.managerNotes || '',
            source: input.source || 'manual',
            isDemo: true,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.message || 'Failed to create reservation.');
        }
        await refreshWorkspace();
        pushToast({
          tone: 'success',
          title: `Created ${json.reservation.bookingReference}`,
          detail: 'Saved with Pending status for confirmation.',
        });
        return json.reservation as ReservationRecord;
      } catch (err) {
        pushToast({
          tone: 'error',
          title: 'Could not save reservation',
          detail: err instanceof Error ? err.message : 'Please check all required fields.',
        });
        return null;
      } finally {
        setBusyAction(false);
      }
    },
    [pushToast, refreshWorkspace]
  );

  const updateReservation = useCallback(
    async (id: string, patch: UpdateReservationInput): Promise<ReservationRecord | null> => {
      setBusyAction(true);
      try {
        const isProd = workspaceMode === 'production' && Boolean(adminToken);
        const url = isProd ? `/api/admin/reservations/${id}` : `/api/demo/reservations/${id}`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (isProd && adminToken) headers.Authorization = `Bearer ${adminToken}`;

        const res = await fetch(url, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(patch),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.message || 'Failed to update reservation.');
        }
        await refreshWorkspace();
        const updated = json.reservation as ReservationRecord;
        let detail = 'Changes saved to workspace.';
        if (patch.status) {
          if (updated.lastOutboundNotificationStatus === 'sent') {
            detail = `Status changed to ${patch.status}; outbound webhook sent.`;
          } else if (updated.lastOutboundNotificationStatus === 'failed') {
            detail = `Status changed to ${patch.status}, but outbound webhook failed (decision preserved).`;
          } else if (updated.lastOutboundNotificationStatus === 'not_configured') {
            detail = `Status changed to ${patch.status}; outbound webhook not configured.`;
          } else {
            detail = `Status changed to ${patch.status}.`;
          }
        }
        pushToast({
          tone: 'success',
          title: `Updated ${updated.bookingReference}`,
          detail,
        });
        return updated;
      } catch (err) {
        pushToast({
          tone: 'error',
          title: 'Update failed',
          detail: err instanceof Error ? err.message : 'Unable to update reservation.',
        });
        return null;
      } finally {
        setBusyAction(false);
      }
    },
    [adminToken, pushToast, refreshWorkspace, workspaceMode]
  );

  const retryNotification = useCallback(
    async (id: string): Promise<ReservationRecord | null> => {
      setBusyAction(true);
      try {
        const res = await fetch(`/api/demo/reservations/${id}/retry-notification`, {
          method: 'POST',
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.message || 'Retry failed.');
        }
        await refreshWorkspace();
        const r = json.reservation as ReservationRecord;
        pushToast({
          tone: r.lastOutboundNotificationStatus === 'failed' ? 'error' : 'info',
          title: `Outbound webhook ${r.lastOutboundNotificationStatus.replace(/_/g, ' ')}`,
          detail: r.bookingReference,
        });
        return r;
      } catch (err) {
        pushToast({
          tone: 'error',
          title: 'Webhook retry failed',
          detail: err instanceof Error ? err.message : 'Unable to retry webhook.',
        });
        return null;
      } finally {
        setBusyAction(false);
      }
    },
    [pushToast, refreshWorkspace]
  );

  const updateConversation = useCallback(
    async (
      id: string,
      patch: { status?: ConversationStatus; needsHumanAssistance?: boolean }
    ): Promise<boolean> => {
      setBusyAction(true);
      try {
        const res = await fetch(`/api/demo/conversations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || 'Update failed.');
        await refreshWorkspace();
        pushToast({
          tone: 'success',
          title: 'Conversation updated',
        });
        return true;
      } catch (err) {
        pushToast({
          tone: 'error',
          title: 'Conversation update failed',
          detail: err instanceof Error ? err.message : undefined,
        });
        return false;
      } finally {
        setBusyAction(false);
      }
    },
    [pushToast, refreshWorkspace]
  );

  const updateCustomerNotes = useCallback(
    async (id: string, internalNotes: string, dietaryRequirements?: string): Promise<boolean> => {
      setBusyAction(true);
      try {
        const res = await fetch(`/api/demo/customers/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ internalNotes, dietaryRequirements }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || 'Update failed.');
        await refreshWorkspace();
        pushToast({ tone: 'success', title: 'Customer record updated' });
        return true;
      } catch (err) {
        pushToast({
          tone: 'error',
          title: 'Could not update customer',
          detail: err instanceof Error ? err.message : undefined,
        });
        return false;
      } finally {
        setBusyAction(false);
      }
    },
    [pushToast, refreshWorkspace]
  );

  const markNotificationRead = useCallback(
    async (id?: string) => {
      try {
        await fetch('/api/demo/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(id ? { id } : {}),
        });
        await refreshWorkspace();
      } catch {
        // Ignore transient read error
      }
    },
    [refreshWorkspace]
  );

  const updateSettings = useCallback(
    async (patch: Partial<RestaurantSettingsRecord>): Promise<boolean> => {
      setBusyAction(true);
      try {
        const res = await fetch('/api/demo/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || 'Could not save settings.');
        await refreshWorkspace();
        pushToast({ tone: 'success', title: 'Settings saved' });
        return true;
      } catch (err) {
        pushToast({
          tone: 'error',
          title: 'Settings update failed',
          detail: err instanceof Error ? err.message : undefined,
        });
        return false;
      } finally {
        setBusyAction(false);
      }
    },
    [pushToast, refreshWorkspace]
  );

  const testIntegrations = useCallback(async (): Promise<IntegrationStatusSummary | null> => {
    setBusyAction(true);
    try {
      const res = await fetch('/api/demo/integrations/test', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || 'Integration test failed.');
      await refreshWorkspace();
      pushToast({
        tone: 'info',
        title: 'Server integration check completed',
        detail: `Storage mode: ${json.integrationStatus.storageMode}`,
      });
      return json.integrationStatus as IntegrationStatusSummary;
    } catch (err) {
      pushToast({
        tone: 'error',
        title: 'Integration test failed',
        detail: err instanceof Error ? err.message : undefined,
      });
      return null;
    } finally {
      setBusyAction(false);
    }
  }, [pushToast, refreshWorkspace]);

  const resetDemoWorkspace = useCallback(
    async (reseed = true): Promise<boolean> => {
      setBusyAction(true);
      try {
        const res = await fetch('/api/demo/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reseed }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || 'Reset failed.');
        setSnapshot(json.snapshot);
        pushToast({
          tone: 'info',
          title: reseed ? 'Demo workspace reset to initial synthetic sample' : 'Demo workspace cleared',
        });
        return true;
      } catch (err) {
        pushToast({
          tone: 'error',
          title: 'Could not reset demo data',
          detail: err instanceof Error ? err.message : undefined,
        });
        return false;
      } finally {
        setBusyAction(false);
      }
    },
    [pushToast]
  );

  const loginAdmin = useCallback(
    async (passcode: string, isFirstRunClaim = false) => {
      try {
        const endpoint = isFirstRunClaim ? '/api/admin/auth/claim' : '/api/admin/auth/login';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok || !json.token) {
          return { ok: false, message: json.message || 'Authentication failed.' };
        }
        setAdminToken(json.token);
        setWorkspaceMode('production');
        pushToast({ tone: 'success', title: 'Switched to Production workspace' });
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : 'Unable to authenticate.',
        };
      }
    },
    [pushToast]
  );

  const logoutAdmin = useCallback(() => {
    setAdminToken(null);
    setWorkspaceMode('demo');
    pushToast({ tone: 'info', title: 'Returned to isolated Demo workspace' });
  }, [pushToast]);

  return (
    <DashboardContext.Provider
      value={{
        snapshot,
        loading,
        error,
        busyAction,
        globalSearch,
        setGlobalSearch,
        toasts,
        pushToast,
        dismissToast,
        refreshWorkspace,
        createReservation,
        updateReservation,
        retryNotification,
        updateConversation,
        updateCustomerNotes,
        markNotificationRead,
        updateSettings,
        testIntegrations,
        resetDemoWorkspace,
        adminToken,
        workspaceMode,
        setWorkspaceMode,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return ctx;
}
