import React, { useState } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { SeverityBadge, ClassificationBadge, ConfidencePill } from '../ui/Badges.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { exceptionService } from '../../services/allServices.js';
import { Sparkles, CheckCircle2, XCircle, MessageSquare, ShieldAlert, ArrowRight } from 'lucide-react';

export function ResolveExceptionModal({ exception, isOpen, onClose, onResolved }) {
  const [decision, setDecision] = useState('ACCEPT_MATCH');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!exception) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      if (decision === 'REJECT_MATCH') {
        await exceptionService.rejectException(exception.id, {
          decision: 'REJECT_MATCH',
          note: note || 'Rejected by financial reviewer.'
        });
      } else {
        await exceptionService.resolveException(exception.id, {
          decision: 'ACCEPT_MATCH',
          note: note || 'Verified against bank & settlement schedule.'
        });
      }

      if (onResolved) onResolved(exception.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update exception. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const bankTx = exception.bankTx;
  const gwTx = exception.gatewayTx;
  const ledTx = exception.ledgerTx;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review Exception: ${exception.transaction_id}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClassificationBadge classification={exception.type} />
            <SeverityBadge severity={exception.severity} />
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">Match Confidence:</span>
            <ConfidencePill confidence={exception.confidence} />
          </div>
        </div>

        {/* 3-Source Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Bank */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
            <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>1. Bank Statement</span>
              <span className="font-mono text-[10px] text-slate-400">{bankTx?.external_transaction_id || 'N/A'}</span>
            </div>
            {bankTx ? (
              <div className="space-y-1.5 text-xs">
                <div className="text-slate-100 font-medium">{bankTx.merchant}</div>
                <div className="font-mono text-emerald-400 font-bold">{formatCurrency(bankTx.amount, bankTx.currency)}</div>
                <div className="text-slate-400 text-[11px]">Date: {formatDate(bankTx.transaction_date)}</div>
                <div className="text-slate-400 text-[11px] font-mono">Ref: {bankTx.reference_id || '—'}</div>
              </div>
            ) : (
              <div className="text-xs text-rose-400 italic py-4">Missing in Bank Statement</div>
            )}
          </div>

          {/* Payment Gateway */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
            <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>2. Gateway Auth</span>
              <span className="font-mono text-[10px] text-slate-400">{gwTx?.external_transaction_id || 'N/A'}</span>
            </div>
            {gwTx ? (
              <div className="space-y-1.5 text-xs">
                <div className="text-slate-100 font-medium">{gwTx.merchant}</div>
                <div className="font-mono text-emerald-400 font-bold">{formatCurrency(gwTx.amount, gwTx.currency)}</div>
                <div className="text-slate-400 text-[11px]">Date: {formatDate(gwTx.transaction_date)}</div>
                <div className="text-slate-400 text-[11px] font-mono">Ref: {gwTx.reference_id || '—'}</div>
              </div>
            ) : (
              <div className="text-xs text-rose-400 italic py-4">Missing in Payment Gateway</div>
            )}
          </div>

          {/* Internal Ledger */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
            <div className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>3. General Ledger</span>
              <span className="font-mono text-[10px] text-slate-400">{ledTx?.external_transaction_id || 'N/A'}</span>
            </div>
            {ledTx ? (
              <div className="space-y-1.5 text-xs">
                <div className="text-slate-100 font-medium">{ledTx.merchant}</div>
                <div className="font-mono text-emerald-400 font-bold">{formatCurrency(ledTx.amount, ledTx.currency)}</div>
                <div className="text-slate-400 text-[11px]">Date: {formatDate(ledTx.transaction_date)}</div>
                <div className="text-slate-400 text-[11px] font-mono">Ref: {ledTx.reference_id || '—'}</div>
              </div>
            ) : (
              <div className="text-xs text-rose-400 italic py-4">Missing in General Ledger</div>
            )}
          </div>
        </div>

        {/* Discrepancy Description & Difference */}
        {exception.difference !== 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Detected Variance: </span>
              <span>₹{Math.abs(exception.difference).toFixed(2)} between sources. {exception.description}</span>
            </div>
          </div>
        )}

        {/* AI Diagnostics & Recommendation */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Forensic Analysis & Audit Advice</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Prompt: merchant_reconciliation v1
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {exception.ai_analysis?.reason || exception.description}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Model Recommendation:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono font-semibold text-[11px] border border-slate-700">
              {exception.ai_analysis?.recommendation || exception.recommendation || 'MANUAL_REVIEW'}
            </span>
          </div>
        </div>

        {/* Resolution Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Reviewer Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-medium transition-all ${
                decision === 'ACCEPT_MATCH'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="ACCEPT_MATCH"
                  checked={decision === 'ACCEPT_MATCH'}
                  onChange={() => setDecision('ACCEPT_MATCH')}
                  className="hidden"
                />
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Accept Match & Reconcile</span>
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-medium transition-all ${
                decision === 'REJECT_MATCH'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}>
                <input
                  type="radio"
                  name="decision"
                  value="REJECT_MATCH"
                  checked={decision === 'REJECT_MATCH'}
                  onChange={() => setDecision('REJECT_MATCH')}
                  className="hidden"
                />
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Reject & Flag for Treasury</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Audit Note / Settlement Rationale</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Verified with merchant statement. Gateway fee difference of ₹50 approved under SLA tolerance."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Logging to Audit Trail...' : 'Confirm Decision'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
