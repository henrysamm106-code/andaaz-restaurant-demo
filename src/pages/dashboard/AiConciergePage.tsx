import React, { useMemo, useState } from 'react';
import { Bot, Flag, CheckCheck, AlertCircle, Lock, ArrowRight } from 'lucide-react';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { useDashboard } from '../../context/DashboardContext';
import { ConversationStatusBadge, ReservationStatusBadge } from '../../components/dashboard/StatusPill';
import { ReservationDrawer } from '../../components/dashboard/ReservationDrawer';
import type { ConversationRecord, ConversationStatus, ReservationRecord } from '../../types/management';

export function AiConciergePage() {
  const { snapshot, updateConversation, busyAction } = useDashboard();
  const [filterStatus, setFilterStatus] = useState<'all' | ConversationStatus | 'handover'>('all');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [drawerResId, setDrawerResId] = useState<string | null>(null);

  const conversations = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.conversations.filter((c) => {
      if (filterStatus === 'handover') return c.needsHumanAssistance;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      return true;
    });
  }, [snapshot, filterStatus]);

  const activeConv: ConversationRecord | null = useMemo(() => {
    if (conversations.length === 0) return null;
    return conversations.find((c) => c.id === selectedConvId) || conversations[0];
  }, [conversations, selectedConvId]);

  const linkedReservation: ReservationRecord | null = useMemo(() => {
    if (!snapshot || !activeConv) return null;
    return (
      snapshot.reservations.find(
        (r) =>
          r.id === activeConv.linkedReservationId ||
          r.conversationId === activeConv.id ||
          r.bookingReference === activeConv.linkedBookingReference
      ) || null
    );
  }, [snapshot, activeConv]);

  const drawerReservation: ReservationRecord | null = useMemo(() => {
    if (!snapshot || !drawerResId) return null;
    return snapshot.reservations.find((r) => r.id === drawerResId) || null;
  }, [snapshot, drawerResId]);

  const whatsappCloudConnected =
    snapshot?.integrationStatus.whatsappCloudState === 'connected';

  return (
    <DashboardShell
      title="AI Concierge Monitoring"
      subtitle="Monitor external n8n WhatsApp AI Agent and Web AI Demo conversations, intent detection, and human handover flags."
    >
      <div className="space-y-4">
        {/* Filter Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: 'All Conversations' },
              { id: 'handover', label: 'Human Handover Needed' },
              { id: 'awaiting_manager', label: 'Awaiting Manager' },
              { id: 'reservation_requested', label: 'Booking Logged' },
              { id: 'resolved', label: 'Resolved' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-[#172332] text-[#FAF8F3] border-[#172332]'
                  : 'bg-white text-[#4F5D6A] border-[#172332]/15 hover:text-[#172332]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Conversation List */}
          <div className="lg:col-span-5 rounded-xl bg-white border border-[#172332]/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#172332]/10 bg-[#FAF8F3] text-xs font-medium text-[#172332] flex items-center justify-between">
              <span>Logged AI Sessions ({conversations.length})</span>
              <span className="text-[11px] text-[#4F5D6A]">Synced via n8n API</span>
            </div>
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#4F5D6A]">
                No conversations match this filter.
              </div>
            ) : (
              <div className="divide-y divide-[#172332]/8 max-h-[620px] overflow-y-auto">
                {conversations.map((conv) => {
                  const isSelected = activeConv?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full text-left p-4 space-y-1.5 transition-colors ${
                        isSelected ? 'bg-[#F2EDE3]' : 'hover:bg-[#FAF8F3]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#172332] truncate">
                          {conv.customerName}
                        </span>
                        <ConversationStatusBadge status={conv.status} />
                      </div>
                      <p className="text-xs text-[#4F5D6A] tabular-nums">
                        {conv.customerIdentifier} ·{' '}
                        {conv.source === 'whatsapp_ai' ? 'WhatsApp AI' : 'Web AI Demo'}
                      </p>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#4F5D6A]">
                        <span>Intent: {conv.detectedIntent}</span>
                        {conv.needsHumanAssistance && (
                          <span className="inline-flex items-center gap-1 text-[#991B1B] font-medium">
                            <AlertCircle className="h-3 w-3" /> Handover
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Transcript & Controls */}
          <div className="lg:col-span-7 rounded-xl bg-white border border-[#172332]/10 flex flex-col overflow-hidden">
            {!activeConv ? (
              <div className="p-10 text-center text-xs text-[#4F5D6A]">
                Select a conversation to view transcript and manager controls.
              </div>
            ) : (
              <>
                <div className="p-4 sm:p-5 border-b border-[#172332]/10 bg-[#FAF8F3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Bot className="h-4 w-4 text-[#7E4D54]" />
                      <h2 className="font-serif text-xl font-medium text-[#172332]">
                        {activeConv.customerName}
                      </h2>
                      <ConversationStatusBadge status={activeConv.status} />
                    </div>
                    <p className="text-xs text-[#4F5D6A] tabular-nums mt-0.5">
                      Session {activeConv.externalSessionId} · Latency:{' '}
                      {activeConv.responseLatencyMs ? `${activeConv.responseLatencyMs} ms` : 'Not recorded'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() =>
                        updateConversation(activeConv.id, {
                          needsHumanAssistance: !activeConv.needsHumanAssistance,
                          status: !activeConv.needsHumanAssistance
                            ? 'human_handover_requested'
                            : 'active',
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#172332]/20 bg-white hover:bg-[#F2EDE3] px-3 py-1.5 text-xs font-medium text-[#172332]"
                    >
                      <Flag className="h-3.5 w-3.5 text-[#991B1B]" />
                      {activeConv.needsHumanAssistance ? 'Clear Flag' : 'Flag Human Assistance'}
                    </button>
                    <button
                      type="button"
                      disabled={busyAction || activeConv.status === 'resolved'}
                      onClick={() =>
                        updateConversation(activeConv.id, {
                          status: 'resolved',
                          needsHumanAssistance: false,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#172332] hover:bg-[#1F2B38] disabled:opacity-45 text-white px-3 py-1.5 text-xs font-medium"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark Resolved
                    </button>
                  </div>
                </div>

                {/* Linked Reservation Strip */}
                {linkedReservation && (
                  <div className="px-5 py-3 bg-[#F2EDE3]/70 border-b border-[#172332]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#172332]">Linked Booking:</span>
                      <span className="font-mono font-semibold tabular-nums">
                        {linkedReservation.bookingReference}
                      </span>
                      <span className="tabular-nums text-[#4F5D6A]">
                        {linkedReservation.reservationDate} · {linkedReservation.reservationTime} ·{' '}
                        {linkedReservation.guestCount} guests
                      </span>
                      <ReservationStatusBadge status={linkedReservation.status} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setDrawerResId(linkedReservation.id)}
                      className="inline-flex items-center gap-1 font-medium text-[#7E4D54] hover:underline"
                    >
                      Review Booking <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Transcript */}
                <div className="flex-1 p-5 space-y-3 max-h-[420px] overflow-y-auto bg-[#FAF8F3]/40">
                  {activeConv.messages.map((m) => {
                    const isCustomer = m.sender === 'customer';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed border ${
                            isCustomer
                              ? 'bg-white border-[#172332]/12 text-[#172332]'
                              : 'bg-[#172332] border-[#172332] text-[#FAF8F3]'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                        <span className="text-[10px] text-[#4F5D6A] mt-1 tabular-nums">
                          {isCustomer ? 'Guest' : 'n8n AI Agent'}
                          {m.latencyMs ? ` · ${m.latencyMs} ms` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Honest Outbound WhatsApp Constraint Notice */}
                <div className="p-4 border-t border-[#172332]/10 bg-[#FAF8F3] flex items-start gap-2.5 text-xs text-[#4F5D6A]">
                  <Lock className="h-4 w-4 text-[#7E4D54] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#172332]">
                      {whatsappCloudConnected
                        ? 'WhatsApp Business Cloud API configured on server'
                        : 'Direct outbound WhatsApp messaging unavailable in this preview'}
                    </p>
                    <p className="mt-0.5">
                      {whatsappCloudConnected
                        ? 'Replies are orchestrated through your external n8n workflow.'
                        : 'Sending messages directly to external WhatsApp users requires WHATSAPP_CLOUD_API_CONFIGURED=true and verified Meta Cloud API credentials inside your n8n workflow.'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ReservationDrawer
        reservation={drawerReservation}
        onClose={() => setDrawerResId(null)}
      />
    </DashboardShell>
  );
}
