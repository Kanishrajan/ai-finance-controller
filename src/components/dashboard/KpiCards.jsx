import React from 'react';
import { Layers, CheckCircle2, Zap, AlertTriangle, Coins, ShieldCheck, Clock, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatCurrency.js';
import { formatPercentage } from '../../utils/formatPercentage.js';

export function KpiCards({ metrics }) {
  if (!metrics) return null;

  const cardsRow1 = [
    {
      id: 'kpi-records-processed',
      num: 'M-01',
      label: 'RECORDS PROCESSED',
      value: (metrics.records_processed || 0).toLocaleString(),
      sub: `${metrics.matched_count || 0} MATCHED • ${metrics.probable_match_count || 0} PROBABLE`,
      icon: Layers,
      accent: 'border-slate-900 text-slate-900',
      badge: 'PROCESSED'
    },
    {
      id: 'kpi-match-rate',
      num: 'M-02',
      label: 'MATCH RATE',
      value: formatPercentage(metrics.match_rate),
      sub: `${metrics.unresolved_count || 0} UNRESOLVED LEFTOVER`,
      icon: CheckCircle2,
      accent: 'border-emerald-700 text-emerald-800 bg-emerald-50/40',
      badge: 'VERIFIED'
    },
    {
      id: 'kpi-auto-resolution',
      num: 'M-03',
      label: 'AUTO STP RESOLUTION',
      value: formatPercentage(metrics.auto_resolution_rate),
      sub: 'ZERO-TOUCH STRAIGHT THROUGH',
      icon: Zap,
      accent: 'border-blue-700 text-blue-800 bg-blue-50/40',
      badge: 'RULE ENGINE'
    },
    {
      id: 'kpi-exceptions',
      num: 'M-04',
      label: 'EXCEPTION QUEUE',
      value: (metrics.exception_count || 0).toString(),
      sub: 'ACTIONABLE REVIEWS PENDING',
      icon: AlertTriangle,
      accent: 'border-amber-600 text-amber-900 bg-amber-50/50',
      badge: 'ACTION REQUIRED',
      highlight: true
    }
  ];

  const cardsRow2 = [
    {
      id: 'kpi-total-value',
      num: 'M-05',
      label: 'TOTAL BATCH VALUE',
      value: formatCurrency(metrics.total_transaction_value),
      compact: formatCompactCurrency(metrics.total_transaction_value),
      sub: 'GROSS VOLUME PROCESSED',
      icon: Coins,
      accent: 'border-slate-900 text-slate-900'
    },
    {
      id: 'kpi-reconciled-value',
      num: 'M-06',
      label: 'RECONCILED VALUE',
      value: formatCurrency(metrics.reconciled_value),
      compact: formatCompactCurrency(metrics.reconciled_value),
      sub: `${formatPercentage((metrics.reconciled_value / Math.max(1, metrics.total_transaction_value)) * 100)} CLEARED TO CASH`,
      icon: ShieldCheck,
      accent: 'border-emerald-700 text-emerald-800'
    },
    {
      id: 'kpi-exception-value',
      num: 'M-07',
      label: 'EXCEPTION EXPOSURE',
      value: formatCurrency(metrics.exception_value),
      compact: formatCompactCurrency(metrics.exception_value),
      sub: 'AT RISK VARIANCE / DISCREPANCY',
      icon: AlertTriangle,
      accent: 'border-rose-700 text-rose-800'
    },
    {
      id: 'kpi-processing-time',
      num: 'M-08',
      label: 'ENGINE LATENCY',
      value: `${((metrics.processing_time_ms || 180) / 1000).toFixed(2)}s`,
      sub: `${metrics.throughput_records_per_sec || 550} RECORDS / SECOND`,
      icon: Clock,
      accent: 'border-indigo-700 text-indigo-800'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardsRow1.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              id={c.id}
              className={`p-5 bg-white border-2 border-slate-900 brutal-shadow transition-all relative overflow-hidden ${c.accent}`}
            >
              <div className="flex items-center justify-between font-mono">
                <span className="text-[10px] font-bold tracking-widest text-slate-500">{c.num}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 border border-slate-900 bg-slate-100 text-slate-900 uppercase">
                  {c.badge}
                </span>
              </div>
              <div className="mt-2 font-mono text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {c.label}
              </div>
              <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {c.value}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 font-mono text-[10px] text-slate-500 font-semibold truncate">
                {c.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Valuation & Integrity Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardsRow2.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              id={c.id}
              className="p-5 bg-white border-2 border-slate-900 brutal-shadow transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between font-mono">
                <span className="text-[10px] font-bold tracking-widest text-slate-500">{c.num}</span>
                <Icon className="w-4 h-4 text-slate-700" />
              </div>
              <div className="mt-2 font-mono text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {c.label}
              </div>
              <div className="mt-1 font-mono text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {c.value}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 font-mono text-[10px] text-slate-500 font-semibold truncate">
                {c.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
