import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  MessageSquare,
  History,
  Bot
} from 'lucide-react';
import { reconciliationService } from '../services/reconciliationService.js';
import { exceptionService } from '../services/allServices.js';
import { ClassificationBadge, SeverityBadge, ConfidencePill, StatusBadge } from '../components/ui/Badges.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatDate } from '../utils/formatDate.js';

export function TransactionDetails({ onRefresh }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txDetails, setTxDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decision, setDecision] = useState('ACCEPT_MATCH');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const res = await reconciliationService.getTransactionDetails(id);
      if (res.success && res.data) {
        setTxDetails(res.data);
      }
    } catch (err) {
      console.error('Error fetching transaction details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!txDetails?.exception) return;

    try {
      setIsSubmitting(true);
      setFeedback(null);

      if (decision === 'REJECT_MATCH') {
        await exceptionService.rejectException(txDetails.exception.id, {
          decision: 'REJECT_MATCH',
          note: note || 'Rejected in transaction inspector.'
        });
      } else {
        await exceptionService.resolveException(txDetails.exception.id, {
          decision: 'ACCEPT_MATCH',
          note: note || 'Approved in transaction inspector.'
        });
      }

      setFeedback({ type: 'success', message: 'Transaction status updated and logged to audit trail.' });
      await fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error?.message || 'Failed to submit decision.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-600 font-mono text-xs font-bold">
        LOADING 3-SOURCE FORENSIC LEDGER DATA...
      </div>
    );
  }

  if (!txDetails) {
    return (
      <div className="py-16 text-center space-y-4 bg-white border-2 border-slate-900 brutal-shadow p-8">
        <h2 className="text-lg font-bold font-display text-slate-900">Transaction Not Found</h2>
        <p className="text-xs text-slate-600">The requested transaction record could not be located in memory.</p>
        <Link to="/reconciliation" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white font-mono text-xs font-bold uppercase tracking-wider">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Reconciliation</span>
        </Link>
      </div>
    );
  }

  const { match, exception, auditLogs } = txDetails;
  const bankTx = match?.bankTx;
  const gwTx = match?.gatewayTx;
  const ledTx = match?.ledgerTx;

  return (
    <div className="space-y-8">
      {/* Back Button & Header */}
      <div>
        <Link
          to="/reconciliation"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-blue-700 hover:text-blue-900 underline underline-offset-4 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Reconciliation Matrix</span>
        </Link>

        <div className="bg-white border-2 border-slate-900 brutal-shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 font-mono">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 uppercase">
                  FORENSIC INSPECTOR
                </span>
                <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-900">
                  {match?.id}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
                Multi-Source Forensic Analysis
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-sans mt-0.5">
                Side-by-side reconciliation of Bank Cleared, Gateway Settlement, and ERP General Ledger records.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <ClassificationBadge classification={match?.classification} />
              <ConfidencePill confidence={match?.confidence} />
              <StatusBadge status={match?.status} />
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 border-2 font-mono text-xs font-bold flex items-center gap-3 brutal-shadow-sm ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-700' : 'bg-rose-50 text-rose-900 border-rose-700'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 3-Source Side-by-Side Comparison Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        {/* Source 1: Bank */}
        <div className="p-5 bg-white border-2 border-slate-900 brutal-shadow space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">1. BANK STATEMENT</span>
            <span className="text-[10px] font-bold text-slate-500">{bankTx?.external_transaction_id || 'N/A'}</span>
          </div>

          {bankTx ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">MERCHANT / COUNTERPARTY</span>
                <span className="text-sm font-bold font-sans text-slate-900">{bankTx.merchant}</span>
                <span className="text-[10px] text-blue-700 font-bold block mt-0.5">Norm: {bankTx.normalized_merchant}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">AMOUNT CLEARED</span>
                <span className="text-base font-bold text-slate-900">{formatCurrency(bankTx.amount, bankTx.currency)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">POSTING DATE</span>
                  <span className="text-slate-900">{formatDate(bankTx.transaction_date)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">REFERENCE ID</span>
                  <span className="text-slate-900">{bankTx.reference_id || '—'}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">RAW STATEMENT LINE</span>
                <span className="text-[11px] text-slate-700 block bg-slate-50 p-2 border border-slate-300">
                  {bankTx.description || '—'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-rose-700 font-bold italic">No Bank statement record found</div>
          )}
        </div>

        {/* Source 2: Gateway */}
        <div className="p-5 bg-white border-2 border-slate-900 brutal-shadow space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">2. PAYMENT GATEWAY</span>
            <span className="text-[10px] font-bold text-slate-500">{gwTx?.external_transaction_id || 'N/A'}</span>
          </div>

          {gwTx ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">MERCHANT / COUNTERPARTY</span>
                <span className="text-sm font-bold font-sans text-slate-900">{gwTx.merchant}</span>
                <span className="text-[10px] text-sky-700 font-bold block mt-0.5">Norm: {gwTx.normalized_merchant}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">AMOUNT SETTLED</span>
                <span className="text-base font-bold text-slate-900">{formatCurrency(gwTx.amount, gwTx.currency)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">AUTH DATE</span>
                  <span className="text-slate-900">{formatDate(gwTx.transaction_date)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">REFERENCE ID</span>
                  <span className="text-slate-900">{gwTx.reference_id || '—'}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">RAW GATEWAY LINE</span>
                <span className="text-[11px] text-slate-700 block bg-slate-50 p-2 border border-slate-300">
                  {gwTx.description || '—'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-rose-700 font-bold italic">No Gateway capture record found</div>
          )}
        </div>

        {/* Source 3: Ledger */}
        <div className="p-5 bg-white border-2 border-slate-900 brutal-shadow space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">3. ERP GENERAL LEDGER</span>
            <span className="text-[10px] font-bold text-slate-500">{ledTx?.external_transaction_id || 'N/A'}</span>
          </div>

          {ledTx ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">ACCOUNT / PARTY</span>
                <span className="text-sm font-bold font-sans text-slate-900">{ledTx.merchant}</span>
                <span className="text-[10px] text-indigo-700 font-bold block mt-0.5">Norm: {ledTx.normalized_merchant}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">JOURNAL AMOUNT</span>
                <span className="text-base font-bold text-slate-900">{formatCurrency(ledTx.amount, ledTx.currency)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">POSTING DATE</span>
                  <span className="text-slate-900">{formatDate(ledTx.transaction_date)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">VOUCHER REF</span>
                  <span className="text-slate-900">{ledTx.reference_id || '—'}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">RAW VOUCHER TEXT</span>
                <span className="text-[11px] text-slate-700 block bg-slate-50 p-2 border border-slate-300">
                  {ledTx.description || '—'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-rose-700 font-bold italic">No ERP Ledger record found</div>
          )}
        </div>
      </div>

      {/* AI Forensic Diagnostic Reasoning Box */}
      <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-slate-900 font-mono">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">AI Forensic Diagnostic Explanation</h3>
              <span className="text-[10px] text-slate-500">ENGINE: GEMINI MULTI-VECTOR REASONING</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">MATCH STRATEGY:</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-900 font-bold border border-slate-900">
              {match?.matching_method}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
          {match?.ai_explanation || exception?.ai_analysis?.reason || 'Transaction classified using standard multi-source deterministic reconciliation rules.'}
        </p>

        {exception?.difference !== 0 && exception?.difference && (
          <div className="p-3 bg-amber-50 border border-amber-600 font-mono text-xs text-amber-900 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>VARIANCE DETECTED: ₹{Math.abs(exception.difference).toFixed(2)} between bank cleared and settled totals.</span>
          </div>
        )}
      </div>

      {/* Human Review Decision Panel (If Exception exists) */}
      {exception && (
        <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow space-y-4 font-mono">
          <div className="border-b border-slate-200 pb-3">
            <div className="text-[10px] font-bold text-amber-800 uppercase">HUMAN-IN-THE-LOOP RESOLUTION</div>
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Controller Decision & SLA Settlement</span>
            </h3>
          </div>

          <form onSubmit={handleResolve} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={`p-4 border-2 flex items-center gap-3 cursor-pointer text-xs transition-all ${
                decision === 'ACCEPT_MATCH'
                  ? 'bg-emerald-50 border-emerald-700 text-emerald-900 brutal-shadow-sm font-bold'
                  : 'bg-white border-slate-900 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="ACCEPT_MATCH"
                  checked={decision === 'ACCEPT_MATCH'}
                  onChange={() => setDecision('ACCEPT_MATCH')}
                  className="hidden"
                />
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-xs uppercase">Accept Match & Reconcile</div>
                  <div className="text-[10px] text-slate-600 mt-0.5 font-normal">Post variance to fee expense / SLA tolerance</div>
                </div>
              </label>

              <label className={`p-4 border-2 flex items-center gap-3 cursor-pointer text-xs transition-all ${
                decision === 'REJECT_MATCH'
                  ? 'bg-rose-50 border-rose-700 text-rose-900 brutal-shadow-sm font-bold'
                  : 'bg-white border-slate-900 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="REJECT_MATCH"
                  checked={decision === 'REJECT_MATCH'}
                  onChange={() => setDecision('REJECT_MATCH')}
                  className="hidden"
                />
                <XCircle className="w-5 h-5 text-rose-700 shrink-0" />
                <div>
                  <div className="text-xs uppercase">Reject & Escalate</div>
                  <div className="text-[10px] text-slate-600 mt-0.5 font-normal">Mark as unlinked discrepancy for treasury</div>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase">Audit Justification Note</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter justification for immutable audit log..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border-2 border-slate-900 text-slate-900 focus:outline-none resize-none font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold uppercase tracking-wider border-2 border-slate-900 brutal-shadow transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'RECORDING DECISION...' : 'SUBMIT RESOLUTION DECISION'}
            </button>
          </form>
        </div>
      )}

      {/* Transaction Specific Audit Trail */}
      <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow space-y-4 font-mono">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-700" />
            <span>Audit History & Event Trail</span>
          </h3>
        </div>

        {auditLogs && auditLogs.length > 0 ? (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 border border-slate-900 text-xs flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.user_name}</span>
                    <span className="px-1.5 py-0.2 border border-slate-900 text-[9px] bg-white text-slate-900 font-bold">
                      {log.user_role}
                    </span>
                    <span className="text-blue-700 font-bold text-[10px]">{log.action}</span>
                  </div>
                  <p className="text-slate-800 mt-1 font-sans">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">{formatDate(log.timestamp)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No manual modifications recorded for this transaction record.</p>
        )}
      </div>
    </div>
  );
}
