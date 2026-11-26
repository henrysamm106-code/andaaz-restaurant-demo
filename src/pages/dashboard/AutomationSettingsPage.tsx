import React from 'react';
import { Activity, Server, Shield, FileCode2 } from 'lucide-react';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { useDashboard } from '../../context/DashboardContext';
import { ConnectionStateBadge } from '../../components/dashboard/StatusPill';

export function AutomationSettingsPage() {
  const { snapshot, testIntegrations, busyAction } = useDashboard();
  const status = snapshot?.integrationStatus;

  const contractRows = [
    {
      method: 'GET',
      path: '/api/integrations/n8n/health',
      auth: 'Public (no PII)',
      purpose: 'Verify server reachability, storage mode, and Asia/Karachi clock.',
    },
    {
      method: 'GET',
      path: '/api/integrations/n8n/availability',
      auth: 'Public (advisory)',
      purpose: 'Fetch operating hours, slots, closure dates, and approval flags for n8n.',
    },
    {
      method: 'POST',
      path: '/api/integrations/n8n/reservations',
      auth: 'Bearer N8N_INTEGRATION_SECRET',
      purpose: 'Ingest WhatsApp AI reservation requests as Pending with duplicate idempotency.',
    },
    {
      method: 'POST',
      path: '/api/integrations/n8n/conversations',
      auth: 'Bearer N8N_INTEGRATION_SECRET',
      purpose: 'Sync conversation transcripts, detected intent, latency, and handover flags.',
    },
    {
      method: 'POST',
      path: '/api/integrations/n8n/events',
      auth: 'Bearer N8N_INTEGRATION_SECRET',
      purpose: 'Log custom n8n execution outcomes or error diagnostics.',
    },
    {
      method: 'POST',
      path: '/api/ai-concierge/chat',
      auth: 'Same-origin proxy',
      purpose: 'Server-side proxy from /automation-demo to N8N_CHAT_WEBHOOK_URL.',
    },
  ];

  return (
    <DashboardShell
      title="Automation & n8n Settings"
      subtitle="Inspect honest server-verified connection states for Supabase, n8n webhooks, WhatsApp Cloud API, and API endpoint contracts."
      actions={
        <button
          type="button"
          disabled={busyAction}
          onClick={() => testIntegrations()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#172332] hover:bg-[#1F2B38] text-white px-4 py-2 text-xs font-medium"
        >
          <Activity className="h-3.5 w-3.5" /> {busyAction ? 'Testing…' : 'Test Server Connections'}
        </button>
      }
    >
      {snapshot && status && (
        <div className="space-y-6">
          {/* Honest Integration Status Matrix */}
          <section className="rounded-xl bg-white border border-[#172332]/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#172332]/10 bg-[#FAF8F3] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-[#7E4D54]" />
                <h2 className="font-serif text-xl font-medium text-[#172332]">
                  Live Integration Health Matrix
                </h2>
              </div>
              <span className="text-[11px] text-[#4F5D6A] tabular-nums">
                Last checked: {new Date(status.checkedAt).toLocaleTimeString('en-GB')}
              </span>
            </div>

            <div className="divide-y divide-[#172332]/8 text-xs">
              <div className="p-4 sm:px-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#172332]">Persistence Engine</p>
                  <p className="text-[#4F5D6A]">
                    Active mode: <span className="font-mono">{status.storageMode}</span> (Supabase service-role stays strictly server-side)
                  </p>
                </div>
                <ConnectionStateBadge state={status.databaseState} />
              </div>

              <div className="p-4 sm:px-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#172332]">Inbound n8n Authentication Secret</p>
                  <p className="text-[#4F5D6A]">
                    Requires <span className="font-mono">N8N_INTEGRATION_SECRET</span> for Bearer auth on /api/integrations/n8n/*.
                  </p>
                </div>
                <ConnectionStateBadge state={status.n8nInboundState} />
              </div>

              <div className="p-4 sm:px-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#172332]">n8n Interactive Chat Webhook Proxy</p>
                  <p className="text-[#4F5D6A]">
                    Configured via server env <span className="font-mono">N8N_CHAT_WEBHOOK_URL</span> for /automation-demo.
                  </p>
                </div>
                <ConnectionStateBadge state={status.n8nChatProxyState} />
              </div>

              <div className="p-4 sm:px-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#172332]">Outbound Reservation Status Webhook</p>
                  <p className="text-[#4F5D6A]">
                    Dispatched via <span className="font-mono">N8N_STATUS_WEBHOOK_URL</span> when manager approves, rejects, or reschedules.
                  </p>
                </div>
                <ConnectionStateBadge state={status.n8nStatusWebhookState} />
              </div>

              <div className="p-4 sm:px-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#172332]">WhatsApp Business Cloud API &amp; Bot Test Number</p>
                  <p className="text-[#4F5D6A]">
                    Separate from official +92 300 0263229.{' '}
                    {status.whatsappTestNumberConfigured
                      ? `Test line configured: ${status.whatsappTestNumberDisplay}`
                      : 'WHATSAPP_TEST_NUMBER not set.'}
                  </p>
                </div>
                <ConnectionStateBadge state={status.whatsappCloudState} />
              </div>

              <div className="p-4 sm:px-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#172332]">In-App Manager Notifications</p>
                  <p className="text-[#4F5D6A]">
                    Active persistence &amp; unread counter inside Management Dashboard.
                  </p>
                </div>
                <ConnectionStateBadge state={status.managerNotificationsState} />
              </div>
            </div>
          </section>

          {/* Endpoint Contract Reference */}
          <section className="rounded-xl bg-white border border-[#172332]/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#172332]/10 bg-[#FAF8F3] flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-[#7E4D54]" />
              <h2 className="font-serif text-xl font-medium text-[#172332]">
                n8n Endpoint Contract Reference
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#172332]/10 text-[11px] uppercase tracking-wider text-[#4F5D6A]">
                    <th className="py-2.5 px-4 font-medium">Method</th>
                    <th className="py-2.5 px-4 font-medium">Endpoint</th>
                    <th className="py-2.5 px-4 font-medium">Security</th>
                    <th className="py-2.5 px-4 font-medium">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172332]/8">
                  {contractRows.map((row) => (
                    <tr key={row.path}>
                      <td className="py-2.5 px-4 font-mono font-semibold text-[#7E4D54]">
                        {row.method}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[#172332]">{row.path}</td>
                      <td className="py-2.5 px-4 text-[#4F5D6A]">{row.auth}</td>
                      <td className="py-2.5 px-4 text-[#4F5D6A]">{row.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Integration Events Log */}
          <section className="rounded-xl bg-white border border-[#172332]/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#172332]/10 bg-[#FAF8F3] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#7E4D54]" />
                <h2 className="font-serif text-xl font-medium text-[#172332]">
                  Recent Integration Events &amp; Diagnostics
                </h2>
              </div>
              <span className="text-[11px] text-[#4F5D6A]">
                Zero credentials stored in client bundle
              </span>
            </div>
            {snapshot.integrationEvents.length === 0 ? (
              <p className="p-6 text-xs text-[#4F5D6A]">No webhook events recorded yet.</p>
            ) : (
              <div className="divide-y divide-[#172332]/8 text-xs">
                {snapshot.integrationEvents.slice(0, 15).map((ev) => (
                  <div
                    key={ev.id}
                    className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium text-[#172332]">
                        <span className="font-mono text-[11px] mr-2 text-[#7E4D54]">
                          {ev.eventType}
                        </span>
                        {ev.summary}
                      </p>
                      {ev.errorMessage && (
                        <p className="text-[11px] text-[#991B1B] mt-0.5">{ev.errorMessage}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 tabular-nums text-[11px] text-[#4F5D6A]">
                      <span
                        className={`px-2 py-0.5 rounded font-medium ${
                          ev.status === 'failed'
                            ? 'bg-[#FEE2E2] text-[#991B1B]'
                            : ev.status === 'not_configured'
                              ? 'bg-[#F3F4F6] text-[#4B5563]'
                              : 'bg-[#DCFCE7] text-[#166534]'
                        }`}
                      >
                        {ev.status}
                        {ev.httpStatus ? ` (${ev.httpStatus})` : ''}
                      </span>
                      <span>{new Date(ev.createdAt).toLocaleTimeString('en-GB')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
