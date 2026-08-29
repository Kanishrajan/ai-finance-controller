import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatCurrency.js';

export function DashboardCharts({ metrics, matches = [], exceptions = [] }) {
  if (!metrics) return null;

  // 1. Status Breakdown
  const statusData = [
    { name: 'Matched', value: metrics.matched_count || 0, color: '#059669' },
    { name: 'Probable', value: metrics.probable_match_count || 0, color: '#0284c7' },
    { name: 'Unresolved', value: metrics.unresolved_count || 0, color: '#64748b' },
    { name: 'Exceptions', value: metrics.exception_count || 0, color: '#d97706' }
  ].filter(d => d.value > 0);

  // 2. Exception Breakdown
  const exceptionCounts = {
    AMOUNT_MISMATCH: 0,
    MISSING_TRANSACTION: 0,
    DUPLICATE_TRANSACTION: 0,
    DATE_MISMATCH: 0,
    LOW_CONFIDENCE: 0
  };

  for (const ex of exceptions) {
    if (exceptionCounts[ex.type] !== undefined) {
      exceptionCounts[ex.type]++;
    } else {
      exceptionCounts.LOW_CONFIDENCE++;
    }
  }

  const exceptionBreakdownData = [
    { name: 'Amount Mismatch', count: exceptionCounts.AMOUNT_MISMATCH, fill: '#d97706' },
    { name: 'Missing Tx', count: exceptionCounts.MISSING_TRANSACTION, fill: '#dc2626' },
    { name: 'Duplicates', count: exceptionCounts.DUPLICATE_TRANSACTION, fill: '#7c3aed' },
    { name: 'Date Lag', count: exceptionCounts.DATE_MISMATCH, fill: '#4f46e5' },
    { name: 'Low Conf', count: exceptionCounts.LOW_CONFIDENCE, fill: '#64748b' }
  ];

  // 3. Financial Value Allocation
  const valueData = [
    { name: 'Total Batch', value: metrics.total_transaction_value || 0, fill: '#2563eb' },
    { name: 'Reconciled', value: metrics.reconciled_value || 0, fill: '#059669' },
    { name: 'At Risk', value: metrics.exception_value || 0, fill: '#dc2626' }
  ];

  // 4. Confidence Distribution
  let confHigh = 0;
  let confMed = 0;
  let confLow = 0;

  for (const m of matches) {
    if (m.confidence >= 0.90) confHigh++;
    else if (m.confidence >= 0.70) confMed++;
    else confLow++;
  }

  if (matches.length === 0 && metrics.records_processed > 0) {
    confHigh = metrics.matched_count || 0;
    confMed = metrics.probable_match_count || 0;
    confLow = metrics.unresolved_count || 0;
  }

  const confidenceData = [
    { tier: '90–100% (STP Auto)', count: confHigh, fill: '#059669' },
    { tier: '70–89% (Probable)', count: confMed, fill: '#0284c7' },
    { tier: '0–69% (Review)', count: confLow, fill: '#dc2626' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Reconciliation Status */}
      <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">CLASSIFICATION MATRIX</div>
            <h3 className="text-base font-bold font-display text-slate-900">Reconciliation Match Split</h3>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 border border-slate-900 bg-slate-100 text-slate-900">
            {metrics.records_processed} TOTAL RECORDS
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={1.5} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#0f172a', borderWidth: '1.5px', borderRadius: '0px', fontSize: '12px', fontFamily: 'monospace' }}
                formatter={(val, name) => [`${val} records (${Math.round((val / metrics.records_processed) * 100)}%)`, name]}
              />
              <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Exception Breakdown */}
      <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div>
            <div className="text-[10px] font-mono font-bold text-amber-700 uppercase">ROOT CAUSE DISTRIBUTION</div>
            <h3 className="text-base font-bold font-display text-slate-900">Exception Category Analysis</h3>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 border border-amber-600 bg-amber-50 text-amber-900">
            {metrics.exception_count} QUEUED
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={exceptionBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" stroke="#0f172a" fontSize={11} fontFamily="monospace" angle={-15} textAnchor="end" />
              <YAxis stroke="#0f172a" fontSize={11} fontFamily="monospace" allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#0f172a', borderWidth: '1.5px', borderRadius: '0px', fontSize: '12px', fontFamily: 'monospace' }}
                formatter={(val) => [`${val} exceptions`, 'Count']}
              />
              <Bar dataKey="count" stroke="#0f172a" strokeWidth={1.5}>
                {exceptionBreakdownData.map((entry, index) => (
                  <Cell key={`cell-ex-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Financial Value Allocation */}
      <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div>
            <div className="text-[10px] font-mono font-bold text-blue-700 uppercase">LIQUIDITY ASSURANCE</div>
            <h3 className="text-base font-bold font-display text-slate-900">Transaction Value Allocation</h3>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 border border-emerald-600 bg-emerald-50 text-emerald-900">
            {formatCompactCurrency(metrics.reconciled_value)} CLEARED
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={valueData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                stroke="#0f172a"
                fontSize={11}
                fontFamily="monospace"
                tickFormatter={(val) => formatCompactCurrency(val)}
              />
              <YAxis dataKey="name" type="category" stroke="#0f172a" fontSize={11} fontFamily="monospace" width={95} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#0f172a', borderWidth: '1.5px', borderRadius: '0px', fontSize: '12px', fontFamily: 'monospace' }}
                formatter={(val) => [formatCurrency(val), 'Value']}
              />
              <Bar dataKey="value" stroke="#0f172a" strokeWidth={1.5}>
                {valueData.map((entry, index) => (
                  <Cell key={`cell-val-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 4: Confidence Score Distribution */}
      <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div>
            <div className="text-[10px] font-mono font-bold text-emerald-700 uppercase">ALGORITHM PRECISION</div>
            <h3 className="text-base font-bold font-display text-slate-900">Confidence Score Distribution</h3>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 border border-blue-600 bg-blue-50 text-blue-900">
            {Math.round((confHigh / Math.max(1, metrics.records_processed)) * 100)}% HIGH PRECISION
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={confidenceData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="tier" stroke="#0f172a" fontSize={11} fontFamily="monospace" />
              <YAxis stroke="#0f172a" fontSize={11} fontFamily="monospace" allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#0f172a', borderWidth: '1.5px', borderRadius: '0px', fontSize: '12px', fontFamily: 'monospace' }}
                formatter={(val) => [`${val} transactions`, 'Volume']}
              />
              <Bar dataKey="count" stroke="#0f172a" strokeWidth={1.5}>
                {confidenceData.map((entry, index) => (
                  <Cell key={`cell-conf-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
