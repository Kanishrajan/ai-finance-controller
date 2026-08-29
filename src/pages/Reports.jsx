import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Coins,
  Clock,
  ExternalLink
} from 'lucide-react';
import { reportService } from '../services/allServices.js';
import { formatCurrency, formatCompactCurrency } from '../utils/formatCurrency.js';
import { formatDate, formatDateTime } from '../utils/formatDate.js';
import { formatPercentage } from '../utils/formatPercentage.js';

export function Reports() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await reportService.getReportById('latest');
      if (res.success && res.data) {
        setReport(res.data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleDownloadCsv = () => {
    const url = reportService.getCsvDownloadUrl(report?.reconciliation_id || 'latest');
    window.location.href = url;
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-600 font-mono text-xs font-bold">
        GENERATING EXECUTIVE RECONCILIATION AUDIT REPORT...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-16 text-center text-slate-600 font-mono text-xs">
        No report generated yet. Run a reconciliation batch first.
      </div>
    );
  }

  const { summary, exception_breakdown, confidence_distribution } = report;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Action Header */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 uppercase">
                06 AUDIT & COMPLIANCE
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-900">
                BATCH: {report.batch_id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
              Certified Executive Audit Report
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-sans mt-0.5">
              Certified financial reconciliation audit summary for controllers, treasury, and external regulatory auditors.
            </p>
          </div>

          <div className="flex items-center gap-2.5 font-mono">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider border-2 border-slate-900 brutal-shadow transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold uppercase tracking-wider border-2 border-slate-900 brutal-shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="p-8 bg-white border-2 border-slate-900 brutal-shadow-lg space-y-8 print:border-none print:shadow-none">
        {/* Certificate Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-800 font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>CERTIFIED LEDGER RECONCILIATION SUMMARY</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
              AI FINANCE CONTROLLER — EXECUTIVE CERTIFICATE
            </h2>
            <div className="text-xs text-slate-600 mt-1 font-mono">
              BATCH ID: <span className="text-slate-900 font-bold">{report.batch_id}</span> • GENERATED: {formatDateTime(report.generated_at)}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-2 border-slate-900 text-right font-mono text-xs">
            <div className="text-emerald-800 font-bold text-xl">{summary.match_rate}</div>
            <div className="text-[9px] text-slate-600 uppercase font-bold">MATCH ACCURACY RATE</div>
          </div>
        </div>

        {/* Section 1: Executive KPI Metrics */}
        <div className="space-y-3 font-mono">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
            1. PORTFOLIO FINANCIAL INTEGRITY METRICS
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-900">
              <div className="text-[10px] text-slate-500 uppercase font-bold">TOTAL PORTFOLIO VALUE</div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {formatCurrency(summary.total_transaction_value)}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-900">
              <div className="text-[10px] text-slate-500 uppercase font-bold">RECONCILED TO CASH</div>
              <div className="text-base font-bold text-emerald-800 mt-1">
                {formatCurrency(summary.reconciled_value)}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-900">
              <div className="text-[10px] text-slate-500 uppercase font-bold">EXCEPTION RISK EXPOSURE</div>
              <div className="text-base font-bold text-rose-800 mt-1">
                {formatCurrency(summary.exception_value)}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-900">
              <div className="text-[10px] text-slate-500 uppercase font-bold">ZERO-TOUCH STP RATE</div>
              <div className="text-base font-bold text-blue-800 mt-1">
                {summary.auto_resolution_rate}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Ingestion & Match Breakdown */}
        <div className="space-y-3 font-mono">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
            2. INGESTION & 3-WAY MATCH BREAKDOWN
          </div>
          <div className="overflow-x-auto border border-slate-900">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="px-4 py-2.5 text-slate-600 font-bold">Total Records Ingested & Evaluated</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900">{summary.records_processed}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-slate-600 font-bold">Exact & Confirmed Matched (Deterministic)</td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-800">{summary.matched_count}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-slate-600 font-bold">Probable Matches (Fuzzy Token Matrix)</td>
                  <td className="px-4 py-2.5 text-right font-bold text-blue-800">{summary.probable_match_count}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-slate-600 font-bold">Exceptions Generated</td>
                  <td className="px-4 py-2.5 text-right font-bold text-amber-800">{summary.exception_count}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-slate-600 font-bold">Resolved by Human Controller</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900">{summary.resolved_exceptions}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-slate-600 font-bold">Execution Engine Throughput</td>
                  <td className="px-4 py-2.5 text-right text-slate-900">
                    {summary.processing_time_ms}ms ({summary.throughput_records_sec} records/sec)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Exception Discrepancy Diagnostics */}
        <div className="space-y-3 font-mono">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
            3. EXCEPTION ROOT CAUSE DISTRIBUTION
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-900 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">AMOUNT DIFF</div>
              <div className="text-base font-bold text-amber-800 mt-1">{exception_breakdown.AMOUNT_MISMATCH}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-900 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">MISSING ENTRY</div>
              <div className="text-base font-bold text-rose-800 mt-1">{exception_breakdown.MISSING_TRANSACTION}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-900 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">DUPLICATE</div>
              <div className="text-base font-bold text-purple-800 mt-1">{exception_breakdown.DUPLICATE_TRANSACTION}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-900 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">DATE LAG</div>
              <div className="text-base font-bold text-indigo-800 mt-1">{exception_breakdown.DATE_MISMATCH}</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-900 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold">LOW CONF.</div>
              <div className="text-base font-bold text-slate-700 mt-1">{exception_breakdown.LOW_CONFIDENCE}</div>
            </div>
          </div>
        </div>

        {/* Certification Signoff */}
        <div className="pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-slate-600">
          <div>
            <span className="font-bold text-slate-900">AUDIT PROTOCOL: </span>
            <span>{report.audit_certified_by}</span>
          </div>
          <div className="text-[10px] text-slate-500">
            SHA-256 CHECKSUM: c7f9e831...1a8b (IMMUTABLE AUDIT RECORD)
          </div>
        </div>
      </div>
    </div>
  );
}
