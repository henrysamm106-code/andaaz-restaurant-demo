import React, { useMemo, useState } from 'react';
import { Bell, CheckCheck, ExternalLink, AlertTriangle } from 'lucide-react';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { useDashboard } from '../../context/DashboardContext';
import { ReservationDrawer } from '../../components/dashboard/ReservationDrawer';
import type { ReservationRecord } from '../../types/management';
import { Link } from '../../lib/router';

export function NotificationsPage() {
  const { snapshot, markNotificationRead } = useDashboard();
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'errors'>('all');
  const [drawerResId, setDrawerResId] = useState<string | null>(null);

  const notifications = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.notifications.filter((n) => {
      if (filterMode === 'unread') return !n.isRead;
      if (filterMode === 'errors') return n.type === 'automation_integration_error';
      return true;
    });
  }, [snapshot, filterMode]);

  const unreadCount = snapshot
    ? snapshot.notifications.filter((n) => !n.isRead).length
    : 0;

  const drawerReservation: ReservationRecord | null = useMemo(() => {
    if (!snapshot || !drawerResId) return null;
    return snapshot.reservations.find((r) => r.id === drawerResId) || null;
  }, [snapshot, drawerResId]);

  return (
    <DashboardShell
      title="Notifications Centre"
      subtitle="In-app alerts for new website enquiries, WhatsApp AI requests, pending confirmations, handover flags, and webhook errors."
      actions={
        <button
          type="button"
          disabled={unreadCount === 0}
          onClick={() => markNotificationRead()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#172332] hover:bg-[#1F2B38] disabled:opacity-45 text-white px-3.5 py-2 text-xs font-medium"
        >
          <CheckCheck className="h-3.5 w-3.5" /> Mark All Read ({unreadCount})
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'all', label: 'All Alerts' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'errors', label: 'Integration Warnings' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                filterMode === tab.id
                  ? 'bg-[#172332] text-[#FAF8F3] border-[#172332]'
                  : 'bg-white text-[#4F5D6A] border-[#172332]/15'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-white border border-[#172332]/10 divide-y divide-[#172332]/8">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#4F5D6A]">
              No notifications in this category.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  !n.isRead ? 'bg-[#FAF8F3]' : 'bg-white'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.type === 'automation_integration_error' ? (
                      <AlertTriangle className="h-4 w-4 text-[#991B1B] shrink-0" />
                    ) : (
                      <Bell className="h-4 w-4 text-[#7E4D54] shrink-0" />
                    )}
                    <h2 className="text-sm font-semibold text-[#172332]">{n.title}</h2>
                    {!n.isRead && (
                      <span className="rounded-md bg-[#7E4D54]/15 text-[#7E4D54] px-2 py-0.5 text-[10px] font-semibold">
                        Unread
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#4F5D6A]">{n.message}</p>
                  <p className="text-[11px] text-[#4F5D6A]/80 tabular-nums">
                    {new Date(n.createdAt).toLocaleString('en-GB')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.reservationId && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!n.isRead) markNotificationRead(n.id);
                        setDrawerResId(n.reservationId);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#172332]/20 bg-white hover:bg-[#F2EDE3] px-3 py-1.5 text-xs font-medium text-[#172332]"
                    >
                      Open Booking <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                  {n.conversationId && !n.reservationId && (
                    <Link
                      to="/staff-demo/ai-concierge"
                      onClick={() => {
                        if (!n.isRead) markNotificationRead(n.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#172332]/20 bg-white hover:bg-[#F2EDE3] px-3 py-1.5 text-xs font-medium text-[#172332]"
                    >
                      Open Concierge <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className="rounded-lg border border-[#172332]/15 px-2.5 py-1.5 text-xs text-[#4F5D6A] hover:text-[#172332]"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ReservationDrawer
        reservation={drawerReservation}
        onClose={() => setDrawerResId(null)}
      />
    </DashboardShell>
  );
}
