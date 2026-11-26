import React from 'react';
import type {
  ConversationStatus,
  IntegrationConnectionState,
  ReservationSource,
  ReservationStatus,
} from '../../types/management';

const STATUS_STYLE: Record<ReservationStatus, { label: string; classes: string }> = {
  pending: {
    label: 'Pending',
    classes: 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/30',
  },
  confirmed: {
    label: 'Confirmed',
    classes: 'bg-[#DCFCE7] text-[#166534] border-[#16A34A]/30',
  },
  seated: {
    label: 'Seated',
    classes: 'bg-[#E0E7FF] text-[#1E40AF] border-[#3B82F6]/30',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-[#F2EDE3] text-[#172332] border-[#172332]/20',
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626]/30',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-[#F3F4F6] text-[#4B5563] border-[#6B7280]/25',
  },
  no_show: {
    label: 'No Show',
    classes: 'bg-[#FCE7F3] text-[#9D174D] border-[#DB2777]/25',
  },
};

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const cfg = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

const SOURCE_STYLE: Record<ReservationSource, { label: string; classes: string }> = {
  whatsapp_ai: {
    label: 'WhatsApp AI',
    classes: 'bg-[#172332]/8 text-[#172332] border-[#172332]/15',
  },
  website: {
    label: 'Website Form',
    classes: 'bg-[#7E4D54]/10 text-[#7E4D54] border-[#7E4D54]/25',
  },
  manual: {
    label: 'Manual Entry',
    classes: 'bg-[#9A7B4F]/12 text-[#745932] border-[#9A7B4F]/30',
  },
  web_ai_demo: {
    label: 'Web AI Demo',
    classes: 'bg-[#E0E7FF] text-[#1E40AF] border-[#3B82F6]/25',
  },
};

export function SourceBadge({ source }: { source: ReservationSource }) {
  const cfg = SOURCE_STYLE[source] || SOURCE_STYLE.website;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

const CONV_STATUS_STYLE: Record<ConversationStatus, { label: string; classes: string }> = {
  active: {
    label: 'Active',
    classes: 'bg-[#E0F2FE] text-[#075985] border-[#0284C7]/25',
  },
  reservation_requested: {
    label: 'Booking Logged',
    classes: 'bg-[#DCFCE7] text-[#166534] border-[#16A34A]/25',
  },
  awaiting_manager: {
    label: 'Awaiting Manager',
    classes: 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/30',
  },
  human_handover_requested: {
    label: 'Human Requested',
    classes: 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626]/30',
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-[#F2EDE3] text-[#4F5D6A] border-[#172332]/15',
  },
};

export function ConversationStatusBadge({ status }: { status: ConversationStatus }) {
  const cfg = CONV_STATUS_STYLE[status] || CONV_STATUS_STYLE.active;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

const CONNECTION_STYLE: Record<IntegrationConnectionState, { label: string; classes: string }> = {
  connected: {
    label: 'Connected',
    classes: 'bg-[#DCFCE7] text-[#166534] border-[#16A34A]/30',
  },
  configured_unverified: {
    label: 'Configured — Not Verified',
    classes: 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/30',
  },
  not_configured: {
    label: 'Not Configured',
    classes: 'bg-[#F3F4F6] text-[#4B5563] border-[#6B7280]/25',
  },
  error: {
    label: 'Error',
    classes: 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626]/30',
  },
  demo_mode: {
    label: 'Demo Mode',
    classes: 'bg-[#E0E7FF] text-[#1E40AF] border-[#3B82F6]/30',
  },
};

export function ConnectionStateBadge({ state }: { state: IntegrationConnectionState }) {
  const cfg = CONNECTION_STYLE[state] || CONNECTION_STYLE.not_configured;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}
