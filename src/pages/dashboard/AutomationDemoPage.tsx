import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Smartphone,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { Link } from '../../lib/router';
import { ASSETS } from '../../data/assets';
import { useDashboard } from '../../context/DashboardContext';
import { computeDashboardMetrics } from '../../lib/analytics';
import { ConnectionStateBadge, ReservationStatusBadge, SourceBadge } from '../../components/dashboard/StatusPill';

interface ChatTurn {
  id: string;
  sender: 'customer' | 'assistant' | 'system';
  text: string;
  latencyMs?: number;
  mode?: string;
}

const DEMO_PROMPTS = [
  'Assalam-o-Alaikum, can we request a rooftop table for 4 tomorrow at 8:00 PM?',
  'Looking for an anniversary dinner for 2 this Friday at 7:00 PM.',
  'My name is Tariq Demo, +92 300 0000888 — please log that request.',
];

export function AutomationDemoPage() {
  const {
    snapshot,
    refreshWorkspace,
    updateReservation,
    resetDemoWorkspace,
    busyAction,
  } = useDashboard();

  const [sessionId, setSessionId] = useState(() => `demo-session-${Date.now()}`);
  const [allowSimulated, setAllowSimulated] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastBookedRef, setLastBookedRef] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<'none' | 'live_n8n' | 'simulated_demo' | 'unconfigured'>('none');
  const [confirmReset, setConfirmReset] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: 'welcome',
      sender: 'system',
      text: 'Client Automation Demo Session ready. Enquiries here always enter the Demo Workspace with Pending status pending manager review.',
    },
  ]);

  const chatConfigured =
    snapshot?.integrationStatus.n8nChatProxyState === 'connected' ||
    snapshot?.integrationStatus.n8nChatProxyState === 'configured_unverified';
  const whatsappTestConfigured =
    Boolean(snapshot?.integrationStatus.whatsappTestNumberConfigured);
  const whatsappTestNumber = snapshot?.integrationStatus.whatsappTestNumberDisplay;

  const demoReservations = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.reservations.filter((r) => r.isDemo).slice(0, 8);
  }, [snapshot]);

  const metrics = useMemo(() => {
    if (!snapshot) return null;
    return computeDashboardMetrics(
      snapshot.reservations,
      snapshot.conversations,
      snapshot.customers,
      snapshot.settings,
      snapshot.karachiToday,
      { preset: 'all' }
    );
  }, [snapshot]);

  const latestReservation = demoReservations[0] || null;

  const sendMessage = async (textToSend: string, forceSimulated?: boolean) => {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;
    const useSimulated = forceSimulated ?? allowSimulated;
    if (forceSimulated) {
      setAllowSimulated(true);
    }
    setSending(true);
    setInput('');
    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      sender: 'customer',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userTurn]);

    const attemptFetch = async () => {
      return fetch('/api/ai-concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: trimmed,
          source: 'web_ai_demo',
          allowSimulated: useSimulated,
        }),
      });
    };

    try {
      let res: Response;
      try {
        res = await attemptFetch();
      } catch {
        // Retry once after brief backoff in case dev preview proxy just cycled
        await new Promise((r) => setTimeout(r, 500));
        res = await attemptFetch();
      }

      const rawText = await res.text();
      let json: Record<string, unknown> | null = null;
      try {
        json = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null;
      } catch {
        json = null;
      }

      if (!json) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'system',
            text: `Server returned HTTP ${res.status} without valid JSON while calling /api/ai-concierge/chat.`,
          },
        ]);
        return;
      }

      if (!res.ok || !json.ok) {
        if (json.error === 'n8n_not_configured') {
          setLastMode('unconfigured');
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'system',
            text:
              typeof json.message === 'string'
                ? json.message
                : `Chat endpoint returned HTTP ${res.status}. Check Automation Settings for details.`,
          },
        ]);
      } else {
        setLastMode(json.simulated ? 'simulated_demo' : 'live_n8n');
        if (typeof json.bookingReference === 'string' && json.bookingReference) {
          setLastBookedRef(json.bookingReference);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            sender: 'assistant',
            text: String(json.reply || ''),
            latencyMs: typeof json.latencyMs === 'number' ? json.latencyMs : undefined,
            mode: json.simulated ? 'Simulated Demo' : 'Live n8n AI',
          },
        ]);
        await refreshWorkspace();
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Connection failed';
      setMessages((prev) => [
        ...prev,
        {
          id: `net-${Date.now()}`,
          sender: 'system',
          text: `Unable to reach /api/ai-concierge/chat (${detail}). Please verify the app server is running or refresh the page.`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleResetDemo = async () => {
    const ok = await resetDemoWorkspace(true);
    if (ok) {
      setSessionId(`demo-session-${Date.now()}`);
      setLastBookedRef(null);
      setLastMode('none');
      setMessages([
        {
          id: `reset-${Date.now()}`,
          sender: 'system',
          text: 'Demo workspace reset to initial synthetic sample data.',
        },
      ]);
      setConfirmReset(false);
    }
  };

  // Determine active workflow progress indicators honestly
  const hasCustomerMsg = messages.some((m) => m.sender === 'customer');
  const hasAssistantReply = messages.some((m) => m.sender === 'assistant');
  const hasAnyPendingDemo = demoReservations.some((r) => r.status === 'pending');
  const hasAnyConfirmedDemo = demoReservations.some((r) => r.status === 'confirmed');
  const outboundSent = demoReservations.some(
    (r) => r.lastOutboundNotificationStatus === 'sent'
  );

  const workflowSteps = [
    { num: 1, label: 'Message Received', done: hasCustomerMsg || Boolean(latestReservation) },
    { num: 2, label: 'Intent & Guests Parsed', done: hasAssistantReply || Boolean(latestReservation) },
    { num: 3, label: 'Availability Rules Checked', done: hasAssistantReply || Boolean(latestReservation) },
    { num: 4, label: 'Saved as Pending', done: Boolean(lastBookedRef) || hasAnyPendingDemo },
    { num: 5, label: 'Customer Profile Synced', done: (snapshot?.customers.length || 0) > 0 },
    { num: 6, label: 'Manager Notified', done: (snapshot?.notifications.length || 0) > 0 },
    { num: 7, label: 'Manager Decision Applied', done: hasAnyConfirmedDemo },
    {
      num: 8,
      label: outboundSent ? 'Outbound Webhook Sent' : 'Outbound Webhook Ready / Unconfigured',
      done: outboundSent,
    },
  ];

  const logo = ASSETS['logo-original'];

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#172332]">
      {/* Standalone Presentation Header */}
      <header className="sticky top-0 z-30 bg-[#172332] text-[#FAF8F3] border-b border-[#FAF8F3]/12">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logo.localPath}
              alt={logo.alt}
              className="h-10 w-10 rounded-md bg-[#FAF8F3] p-0.5 object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="font-serif text-lg sm:text-xl font-medium truncate">
                Andaaz Client Automation Demo Centre
              </p>
              <p className="text-[11px] text-[#FAF8F3]/65 truncate">
                Fort Road, Lahore · n8n + WhatsApp AI Concierge Integration Preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#FAF8F3]/20 px-3 py-1.5 text-xs text-[#FAF8F3]/85 hover:bg-[#FAF8F3]/10 whitespace-nowrap"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Public Website
            </Link>
            <Link
              to="/staff-demo"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#7E4D54] hover:bg-[#693E45] text-[#FAF8F3] px-3.5 py-1.5 text-xs font-medium whitespace-nowrap"
            >
              Management Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Section 4 Top Strip: End-to-End 8-Step Pipeline */}
        <section className="rounded-2xl bg-white border border-[#172332]/12 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-serif text-2xl font-medium text-[#172332] flex items-center gap-2">
              <Workflow className="h-5 w-5 text-[#7E4D54]" />
              8-Step Reservation Automation Pipeline
            </h1>
            <span className="text-xs text-[#4F5D6A]">
              Isolated Demo Workspace · Zero production guest data touched
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {workflowSteps.map((step) => (
              <div
                key={step.num}
                className={`rounded-lg border p-2.5 text-[11px] space-y-1 ${
                  step.done
                    ? 'bg-[#DCFCE7]/60 border-[#16A34A]/30 text-[#14532D]'
                    : 'bg-[#FAF8F3] border-[#172332]/10 text-[#4F5D6A]'
                }`}
              >
                <span className="font-mono font-semibold block tabular-nums">
                  0{step.num}
                </span>
                <span className="font-medium leading-snug block">{step.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sections 1 & 2 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Section 1: Interactive AI Reservation Chat Simulator */}
          <section className="lg:col-span-7 rounded-2xl bg-white border border-[#172332]/12 overflow-hidden flex flex-col">
            <div className="px-5 py-4 bg-[#172332] text-[#FAF8F3] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-medium">
                  1. Interactive AI Concierge Simulator
                </h2>
                <p className="text-[11px] text-[#FAF8F3]/75">
                  All enquiries create Pending requests and never auto-confirm availability.
                </p>
              </div>
              {snapshot && (
                <ConnectionStateBadge
                  state={
                    lastMode === 'simulated_demo'
                      ? 'demo_mode'
                      : snapshot.integrationStatus.n8nChatProxyState
                  }
                />
              )}
            </div>

            {/* Honest Unconfigured Banner & Opt-in Simulated Toggle */}
            {!chatConfigured && (
              <div className="px-5 py-3 bg-[#FEF3C7]/70 border-b border-[#F59E0B]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2 text-[#92400E]">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Live <span className="font-mono">N8N_CHAT_WEBHOOK_URL</span> is not configured.
                    {allowSimulated
                      ? ' Running in explicitly labeled [Simulated Demo] mode.'
                      : ' Enable Simulated Demo below to test the workflow locally.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowSimulated((v) => !v)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold border whitespace-nowrap ${
                    allowSimulated
                      ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                      : 'bg-white text-[#92400E] border-[#92400E]/30 hover:bg-[#FEF3C7]'
                  }`}
                >
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  {allowSimulated ? 'Simulated Demo Enabled' : 'Enable Simulated Demo'}
                </button>
              </div>
            )}

            {/* Chat Thread */}
            <div className="p-5 space-y-3 h-[340px] overflow-y-auto bg-[#F5F1E8]/70">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'customer'
                      ? 'items-end'
                      : m.sender === 'system'
                        ? 'items-center'
                        : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                      m.sender === 'customer'
                        ? 'bg-[#7E4D54] text-[#FAF8F3]'
                        : m.sender === 'system'
                          ? 'bg-white border border-[#172332]/15 text-[#4F5D6A] text-center'
                          : 'bg-white border border-[#172332]/12 text-[#172332]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                  {(m.mode || m.latencyMs) && (
                    <span className="text-[10px] text-[#4F5D6A] mt-1 tabular-nums">
                      {m.mode} {m.latencyMs ? `· ${m.latencyMs} ms` : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Test Prompts */}
            <div className="px-4 py-2.5 border-t border-[#172332]/10 bg-[#FAF8F3] flex flex-wrap gap-1.5">
              {DEMO_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={sending}
                  onClick={() => sendMessage(p)}
                  className="rounded-md border border-[#172332]/15 bg-white hover:bg-[#F2EDE3] px-2.5 py-1 text-[11px] text-[#172332] text-left"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="p-3.5 border-t border-[#172332]/10 bg-white flex items-center gap-2.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a test reservation enquiry…"
                className="flex-1 rounded-lg border border-[#172332]/18 bg-[#FAF8F3] px-3.5 py-2 text-xs text-[#172332]"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#172332] hover:bg-[#1F2B38] disabled:opacity-45 text-white px-4 py-2 text-xs font-medium"
              >
                <Send className="h-3.5 w-3.5" /> {sending ? 'Sending…' : 'Send'}
              </button>
            </form>
          </section>

          {/* Section 2: Test on WhatsApp + Section 5 Analytics & Reset */}
          <div className="lg:col-span-5 space-y-6">
            <section className="rounded-2xl bg-white border border-[#172332]/12 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-serif text-xl font-medium text-[#172332] flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-[#7E4D54]" />
                  2. Test on WhatsApp
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                    whatsappTestConfigured
                      ? 'bg-[#DCFCE7] text-[#166534] border-[#16A34A]/30'
                      : 'bg-[#F3F4F6] text-[#4B5563] border-[#6B7280]/25'
                  }`}
                >
                  {whatsappTestConfigured ? 'Test Number Ready' : 'WhatsApp test connection pending'}
                </span>
              </div>

              {whatsappTestConfigured && whatsappTestNumber ? (
                <div className="space-y-3 text-xs">
                  <p className="text-[#4F5D6A]">
                    Dedicated test bot line configured on server:{' '}
                    <span className="font-semibold text-[#172332] tabular-nums">
                      {whatsappTestNumber}
                    </span>
                  </p>
                  <a
                    href={`https://wa.me/${whatsappTestNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                      'Assalam-o-Alaikum, testing Andaaz WhatsApp AI Demo.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#166534] hover:bg-[#14532D] text-white px-4 py-2 text-xs font-medium"
                  >
                    Open Dedicated WhatsApp Test Bot
                  </a>
                </div>
              ) : (
                <div className="rounded-xl bg-[#FAF8F3] border border-[#172332]/10 p-3.5 text-xs text-[#4F5D6A] space-y-1.5">
                  <p className="font-medium text-[#172332]">
                    WhatsApp test connection pending
                  </p>
                  <p className="leading-relaxed">
                    Set <span className="font-mono">WHATSAPP_TEST_NUMBER</span> on the server once your dedicated n8n WhatsApp Cloud API sandbox number is provisioned. Andaaz Restaurant&apos;s official guest desk number (+92 300 0263229) is intentionally never routed into the automated test simulator.
                  </p>
                </div>
              )}
            </section>

            {/* Section 5: Demo Analytics & Reset */}
            <section className="rounded-2xl bg-white border border-[#172332]/12 p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-serif text-xl font-medium text-[#172332]">
                  5. Demo Analytics &amp; Reset
                </h2>
                <Link
                  to="/staff-demo/analytics"
                  className="text-xs font-medium text-[#7E4D54] hover:underline"
                >
                  Full Analytics
                </Link>
              </div>

              {metrics && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-[#FAF8F3] border border-[#172332]/10 p-3">
                    <span className="text-[#4F5D6A] block">Demo Requests</span>
                    <span className="text-xl font-serif font-semibold text-[#172332] tabular-nums">
                      {demoReservations.length}
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#FAF8F3] border border-[#172332]/10 p-3">
                    <span className="text-[#4F5D6A] block">AI-Created</span>
                    <span className="text-xl font-serif font-semibold text-[#172332] tabular-nums">
                      {metrics.aiCreatedReservations}
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#FAF8F3] border border-[#172332]/10 p-3">
                    <span className="text-[#4F5D6A] block">Pending Review</span>
                    <span className="text-xl font-serif font-semibold text-[#92400E] tabular-nums">
                      {metrics.pendingApproval}
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#FAF8F3] border border-[#172332]/10 p-3">
                    <span className="text-[#4F5D6A] block">Confirmed</span>
                    <span className="text-xl font-serif font-semibold text-[#166534] tabular-nums">
                      {metrics.confirmedCount}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-[#172332]/10">
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#DC2626]/30 text-[#991B1B] hover:bg-[#FEE2E2] px-3.5 py-2 text-xs font-medium"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset Demo Data
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/30 p-3 text-xs">
                    <span className="text-[#991B1B] font-medium">
                      Restore demo workspace to initial synthetic records?
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="rounded-md bg-white border border-[#172332]/15 px-2.5 py-1 text-[#172332]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={handleResetDemo}
                        className="rounded-md bg-[#991B1B] text-white px-2.5 py-1 font-medium"
                      >
                        Confirm Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Section 3: Live Demonstration Reservation Activity */}
        <section className="rounded-2xl bg-white border border-[#172332]/12 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#172332]/10 bg-[#FAF8F3] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-medium text-[#172332]">
                3. Live Demonstration Reservation Activity
              </h2>
              <p className="text-xs text-[#4F5D6A]">
                Scoped strictly to <span className="font-mono">is_demo = true</span> records. Approve or reject here or inspect inside the full Management Dashboard.
              </p>
            </div>
            <Link
              to="/staff-demo/reservations"
              className="text-xs font-medium text-[#7E4D54] hover:underline inline-flex items-center gap-1"
            >
              Open Full Reservations Table <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#172332]/10 text-[11px] uppercase tracking-wider text-[#4F5D6A]">
                  <th className="py-2.5 px-4 font-medium">Ref</th>
                  <th className="py-2.5 px-4 font-medium">Guest</th>
                  <th className="py-2.5 px-4 font-medium">Date &amp; Time</th>
                  <th className="py-2.5 px-4 font-medium">Guests &amp; Seating</th>
                  <th className="py-2.5 px-4 font-medium">Source</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Quick Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#172332]/8">
                {demoReservations.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-4 font-mono text-[11px] tabular-nums">
                      {r.bookingReference}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#172332]">
                      {r.customerName}
                    </td>
                    <td className="py-2.5 px-4 tabular-nums text-[#4F5D6A]">
                      {r.reservationDate} · {r.reservationTime}
                    </td>
                    <td className="py-2.5 px-4 text-[#4F5D6A] capitalize">
                      {r.guestCount} · {r.seatingPreference}
                    </td>
                    <td className="py-2.5 px-4">
                      <SourceBadge source={r.source} />
                    </td>
                    <td className="py-2.5 px-4">
                      <ReservationStatusBadge status={r.status} />
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {r.status === 'pending' ? (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            disabled={busyAction}
                            onClick={() =>
                              updateReservation(r.id, {
                                status: 'confirmed',
                                actionNote: 'Confirmed during client demo walkthrough',
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-[#166534] text-white px-2.5 py-1 text-[11px] font-medium"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Confirm
                          </button>
                          <button
                            type="button"
                            disabled={busyAction}
                            onClick={() =>
                              updateReservation(r.id, {
                                status: 'rejected',
                                actionNote: 'Rejected during client demo walkthrough',
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-[#DC2626]/30 text-[#991B1B] px-2.5 py-1 text-[11px] font-medium"
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#4F5D6A]">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
