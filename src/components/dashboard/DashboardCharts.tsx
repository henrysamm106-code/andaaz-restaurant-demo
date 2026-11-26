import React from 'react';
import type { DashboardMetrics } from '../../lib/analytics';

export function ActivityByDateChart({
  data,
}: {
  data: DashboardMetrics['byDate'];
}) {
  if (data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-sm text-[#4F5D6A] border border-dashed border-[#172332]/15 rounded-xl">
        Not enough reservation data for this date range.
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-48 pt-4 pb-1 px-1 overflow-x-auto">
        {data.map((item) => {
          const totalPct = Math.max(8, Math.round((item.total / maxTotal) * 100));
          const aiPct = item.total > 0 ? Math.round((item.ai / item.total) * 100) : 0;
          const shortDate = item.date.slice(5);
          return (
            <div
              key={item.date}
              className="flex-1 min-w-[44px] flex flex-col items-center justify-end h-full group"
              title={`${item.date}: ${item.total} requests (${item.guests} guests, ${item.ai} AI)`}
            >
              <span className="text-[11px] font-medium text-[#172332] tabular-nums mb-1">
                {item.total}
              </span>
              <div
                className="w-full max-w-[36px] rounded-t-md bg-[#172332]/18 overflow-hidden flex flex-col justify-end border border-[#172332]/15"
                style={{ height: `${totalPct}%` }}
              >
                <div
                  className="w-full bg-[#7E4D54] transition-all"
                  style={{ height: `${aiPct}%` }}
                />
              </div>
              <span className="text-[10px] text-[#4F5D6A] tabular-nums mt-1.5 whitespace-nowrap">
                {shortDate}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#4F5D6A] pt-1 border-t border-[#172332]/8">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-[#7E4D54] inline-block" /> AI Concierge
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-[#172332]/25 inline-block" /> Website &amp; Manual
        </span>
      </div>
    </div>
  );
}

export function SourceBreakdownBars({
  data,
}: {
  data: DashboardMetrics['bySource'];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-sm text-[#4F5D6A] border border-dashed border-[#172332]/15 rounded-xl">
        Not enough reservation data to chart channels.
      </div>
    );
  }

  const colors: Record<string, string> = {
    whatsapp_ai: 'bg-[#172332]',
    website: 'bg-[#7E4D54]',
    manual: 'bg-[#9A7B4F]',
    web_ai_demo: 'bg-[#4F5D6A]',
  };

  return (
    <div className="space-y-3.5">
      {data.map((row) => (
        <div key={row.source} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#172332]">{row.label}</span>
            <span className="text-[#4F5D6A] tabular-nums">
              {row.count} ({row.percentage}%)
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[#172332]/8 overflow-hidden">
            <div
              className={`h-full rounded-full ${colors[row.source] || 'bg-[#172332]'}`}
              style={{ width: `${row.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatusDistributionList({
  data,
}: {
  data: DashboardMetrics['byStatus'];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-[#4F5D6A] border border-dashed border-[#172332]/15 rounded-xl">
        No bookings in this range.
      </div>
    );
  }

  const barColor: Record<string, string> = {
    pending: 'bg-[#D97706]',
    confirmed: 'bg-[#15803D]',
    seated: 'bg-[#2563EB]',
    completed: 'bg-[#172332]',
    cancelled: 'bg-[#6B7280]',
    rejected: 'bg-[#DC2626]',
    no_show: 'bg-[#BE185D]',
  };

  return (
    <div className="space-y-2.5">
      {data
        .filter((d) => d.count > 0 || ['pending', 'confirmed', 'completed'].includes(d.status))
        .map((row) => {
          const pct = Math.round((row.count / total) * 100);
          return (
            <div key={row.status} className="grid grid-cols-12 items-center gap-2 text-xs">
              <span className="col-span-4 text-[#172332] font-medium">{row.label}</span>
              <div className="col-span-6 h-2 rounded-full bg-[#172332]/8 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor[row.status] || 'bg-[#172332]'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="col-span-2 text-right tabular-nums text-[#4F5D6A]">
                {row.count}
              </span>
            </div>
          );
        })}
    </div>
  );
}

export function PeakHoursChart({ data }: { data: DashboardMetrics['peakHours'] }) {
  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-[#4F5D6A] border border-dashed border-[#172332]/15 rounded-xl">
        No arrival slot data yet.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-2.5">
      {data.map((item) => {
        const pct = Math.round((item.count / max) * 100);
        return (
          <div key={item.slot} className="grid grid-cols-12 items-center gap-2 text-xs">
            <span className="col-span-4 font-medium text-[#172332] truncate tabular-nums">
              {item.slot}
            </span>
            <div className="col-span-6 h-2.5 rounded-full bg-[#172332]/8 overflow-hidden">
              <div className="h-full rounded-full bg-[#7E4D54]" style={{ width: `${pct}%` }} />
            </div>
            <span className="col-span-2 text-right tabular-nums text-[#4F5D6A]">
              {item.count} req
            </span>
          </div>
        );
      })}
    </div>
  );
}
