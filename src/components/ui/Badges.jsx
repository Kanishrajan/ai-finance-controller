import React from 'react';

export function SeverityBadge({ severity = 'LOW' }) {
  const styles = {
    CRITICAL: 'bg-rose-50 text-rose-800 border-rose-300',
    HIGH: 'bg-amber-50 text-amber-800 border-amber-300',
    MEDIUM: 'bg-yellow-50 text-yellow-800 border-yellow-300',
    LOW: 'bg-blue-50 text-blue-800 border-blue-200'
  };

  const label = (severity || 'LOW').toUpperCase();
  const cls = styles[label] || styles.LOW;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider font-mono ${cls}`}>
      {label}
    </span>
  );
}

export function ClassificationBadge({ classification = 'MATCHED' }) {
  const styles = {
    MATCHED: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    PROBABLE_MATCH: 'bg-sky-50 text-sky-800 border-sky-300',
    AMOUNT_MISMATCH: 'bg-amber-50 text-amber-800 border-amber-300',
    MISSING_TRANSACTION: 'bg-rose-50 text-rose-800 border-rose-300',
    DUPLICATE_TRANSACTION: 'bg-purple-50 text-purple-800 border-purple-300',
    DUPLICATE: 'bg-purple-50 text-purple-800 border-purple-300',
    DATE_MISMATCH: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    UNRESOLVED: 'bg-slate-100 text-slate-800 border-slate-300',
    LOW_CONFIDENCE: 'bg-slate-100 text-slate-700 border-slate-300'
  };

  const key = (classification || 'UNRESOLVED').toUpperCase();
  const cls = styles[key] || styles.UNRESOLVED;
  const readable = key.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${cls}`}>
      {readable}
    </span>
  );
}

export function ConfidencePill({ confidence = 1.0 }) {
  const pct = Math.round((confidence || 0) * 100);
  let color = 'bg-emerald-50 text-emerald-800 border-emerald-300';
  if (pct < 70) color = 'bg-rose-50 text-rose-800 border-rose-300';
  else if (pct < 90) color = 'bg-amber-50 text-amber-800 border-amber-300';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold border ${color}`}>
      {pct}%
    </span>
  );
}

export function StatusBadge({ status = 'OPEN' }) {
  const styles = {
    OPEN: 'bg-amber-50 text-amber-900 border-amber-300',
    RESOLVED: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    REJECTED: 'bg-rose-50 text-rose-900 border-rose-300',
    AUTO_MATCHED: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    REVIEW_REQUIRED: 'bg-amber-50 text-amber-900 border-amber-300',
    COMPLETED: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    PROCESSING: 'bg-blue-50 text-blue-900 border-blue-300'
  };

  const key = (status || 'OPEN').toUpperCase();
  const cls = styles[key] || styles.OPEN;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider font-mono ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${key === 'RESOLVED' || key === 'AUTO_MATCHED' || key === 'COMPLETED' ? 'bg-emerald-600' : key === 'REJECTED' ? 'bg-rose-600' : 'bg-amber-600'}`}></span>
      {key.replace(/_/g, ' ')}
    </span>
  );
}

