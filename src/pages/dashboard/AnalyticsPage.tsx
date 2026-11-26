import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { DashboardShell } from '../../components/dashboard/DashboardShell';
import { useDashboard } from '../../context/DashboardContext';
import {
  buildReservationsCsv,
  computeDashboardMetrics,
  filterReservationsByRange,
  type DateRangePreset,
} from '../../lib/analytics';
import {
  ActivityByDateChart,
  PeakHoursChart,
  SourceBreakdownBars,
  StatusDistributionList,
} from '../../components/dashboard/DashboardCharts';

export function AnalyticsPage() {
  const { snapshot } = useDashboard();
  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const rangeFilter = useMemo(
    () => ({ preset, customStart, customEnd }),
    [preset, customStart, customEnd]
  );

  const metrics = useMemo(() => {
    if (!snapshot) return null;
    return computeDashboardMetrics(
      snapshot.reservations,
      snapshot.conversations,
      snapshot.customers,
      snapshot.settings,
      snapshot.karachiToday,
      rangeFilter
    );
  }, [snapshot, rangeFilter]);

  const filteredRows = useMemo(() => {
    if (!snapshot) return [];
    return filterReservationsByRange(
      snapshot.reservations,
      rangeFilter,
      snapshot.karachiToday
    );
  }, [snapshot, rangeFilter]);

  const handleExportCsv = () => {
    const csv = buildReservationsCsv(filteredRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `andaaz-analytics-${preset}-${snapshot?.karachiToday || 'report'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell
      title="Analytics & Reports"
      subtitle="Live reservation trends, AI conversion metrics, peak evening demand, and CSV export calculated strictly from stored records."
      actions={
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#172332] hover:bg-[#1F2B38] text-white px-3.5 py-2 text-xs font-medium"
        >
          <Download className="h-3.5 w-3.5" /> Export Range CSV ({filteredRows.length})
        </button>
      }
    >
      {snapshot && metrics && (
        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="rounded-xl bg-white border border-[#172332]/10 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: 'Last 7 Days' },
                  { id: '30d', label: 'Last 30 Days' },
                  { id: 'all', label: 'All Recorded' },
                  { id: 'custom', label: 'Custom Range' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPreset(tab.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    preset === tab.id
                      ? 'bg-[#7E4D54] text-white border-[#7E4D54]'
                      : 'bg-[#FAF8F3] text-[#4F5D6A] border-[#172332]/15'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  aria-label="Start date"
                  className="rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-2.5 py-1.5 tabular-nums"
                />
                <span className="text-[#4F5D6A]">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  aria-label="End date"
                  className="rounded-lg border border-[#172332]/15 bg-[#FAF8F3] px-2.5 py-1.5 tabular-nums"
                />
              </div>
            )}
          </div>

          {/* Honest Analytical Metric Definitions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white border border-[#172332]/10 p-4 space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-[#4F5D6A] font-medium">
                AI Conversion Rate
              </p>
              <p className="text-2xl font-serif font-semibold text-[#172332] tabular-nums">
                {metrics.aiConversionRate !== null ? `${metrics.aiConversionRate}%` : 'Not enough data'}
              </p>
              <p className="text-[11px] text-[#4F5D6A]">
                {metrics.eligibleAiConversations} eligible AI chats with ≥1 message producing stored bookings
              </p>
            </div>

            <div className="rounded-xl bg-white border border-[#172332]/10 p-4 space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-[#4F5D6A] font-medium">
                After-Hours Enquiries
              </p>
              <p className="text-2xl font-serif font-semibold text-[#172332] tabular-nums">
                {metrics.afterHoursRequests !== null ? metrics.afterHoursRequests : 'Unavailable'}
              </p>
              <p className="text-[11px] text-[#4F5D6A]">
                {snapshot.settings.hoursConfigured
                  ? `Outside ${snapshot.settings.openingTime}–${snapshot.settings.closingTime} PKT`
                  : 'Operating hours not configured in Availability Settings'}
              </p>
            </div>

            <div className="rounded-xl bg-white border border-[#172332]/10 p-4 space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-[#4F5D6A] font-medium">
                Mean AI Latency
              </p>
              <p className="text-2xl font-serif font-semibold text-[#172332] tabular-nums">
                {metrics.avgAiResponseMs !== null ? `${metrics.avgAiResponseMs} ms` : 'Not measured'}
              </p>
              <p className="text-[11px] text-[#4F5D6A]">
                Average of stored n8n / demo response times
              </p>
            </div>

            <div className="rounded-xl bg-white border border-[#172332]/10 p-4 space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-[#4F5D6A] font-medium">
                Repeat Guest Profiles
              </p>
              <p className="text-2xl font-serif font-semibold text-[#172332] tabular-nums">
                {metrics.repeatGuestCount}
              </p>
              <p className="text-[11px] text-[#4F5D6A]">
                Normalized phone records with 2+ active/completed bookings
              </p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <section className="lg:col-span-7 rounded-xl bg-white border border-[#172332]/10 p-5 space-y-3">
              <h2 className="font-serif text-xl font-medium text-[#172332]">
                Daily Request Volume
              </h2>
              <ActivityByDateChart data={metrics.byDate} />
            </section>

            <section className="lg:col-span-5 rounded-xl bg-white border border-[#172332]/10 p-5 space-y-3">
              <h2 className="font-serif text-xl font-medium text-[#172332]">
                Channel Attribution
              </h2>
              <SourceBreakdownBars data={metrics.bySource} />
            </section>

            <section className="lg:col-span-6 rounded-xl bg-white border border-[#172332]/10 p-5 space-y-3">
              <h2 className="font-serif text-xl font-medium text-[#172332]">
                Peak Requested Slots (PKT)
              </h2>
              <PeakHoursChart data={metrics.peakHours} />
            </section>

            <section className="lg:col-span-6 rounded-xl bg-white border border-[#172332]/10 p-5 space-y-3">
              <h2 className="font-serif text-xl font-medium text-[#172332]">
                Status Outcomes
              </h2>
              <StatusDistributionList data={metrics.byStatus} />
            </section>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
