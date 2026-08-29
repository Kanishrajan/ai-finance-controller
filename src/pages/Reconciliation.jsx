import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GitMerge,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Bot,
  Layers,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { reconciliationService } from '../services/reconciliationService.js';
import { ClassificationBadge, ConfidencePill, StatusBadge } from '../components/ui/Badges.jsx';
import { ReconciliationNetwork3D } from '../components/three/ReconciliationNetwork3D.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatDate } from '../utils/formatDate.js';

export function Reconciliation({ refreshTrigger }) {
  const [reconciliations, setReconciliations] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [matches, setMatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode3D, setViewMode3D] = useState(true);

  const fetchReconciliationData = async () => {
    try {
      setIsLoading(true);
      const res = await reconciliationService.getAllReconciliations();
      if (res.success && res.data?.length > 0) {
        setReconciliations(res.data);
        const active = res.data[0];
        setSelectedBatchId(active.id);

        const recDetail = await reconciliationService.getReconciliationById(active.id);
        if (recDetail.success && recDetail.data) {
          setMatches(recDetail.data.matches || []);
        }
      }
    } catch (err) {
      console.error('Error fetching reconciliations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliationData();
  }, [refreshTrigger]);

  const handleBatchChange = async (recId) => {
    setSelectedBatchId(recId);
    try {
      setIsLoading(true);
      const recDetail = await reconciliationService.getReconciliationById(recId);
      if (recDetail.success && recDetail.data) {
        setMatches(recDetail.data.matches || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (classificationFilter !== 'ALL' && m.classification !== classificationFilter) return false;
    if (methodFilter !== 'ALL' && m.matching_method !== methodFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const txId = m.transaction_id?.toLowerCase() || '';
      const bankM = m.bankTx?.merchant?.toLowerCase() || '';
      const gwM = m.gatewayTx?.merchant?.toLowerCase() || '';
      const ref = m.bankTx?.reference_id?.toLowerCase() || m.gatewayTx?.reference_id?.toLowerCase() || '';
      return txId.includes(q) || bankM.includes(q) || gwM.includes(q) || ref.includes(q);
    }
    return true;
  });

  const activeRec = reconciliations.find((r) => r.id === selectedBatchId) || reconciliations[0];

  const pipelineStages = [
    { num: '01', name: 'Ingestion', desc: 'Bank + Gateway + Ledger', status: 'done' },
    { num: '02', name: 'Schema Valid.', desc: 'Currency & Col Check', status: 'done' },
    { num: '03', name: 'Normalization', desc: 'Strip PII & Suffixes', status: 'done' },
    { num: '04', name: 'Exact Match', desc: 'Ref ID & Exact Match', status: 'done' },
    { num: '05', name: 'Fuzzy Match', desc: 'RapidFuzz + Lag Window', status: 'done' },
    { num: '06', name: 'AI Diagnostics', desc: 'Gemini Anomaly Triage', status: 'done' },
    { num: '07', name: 'Human Review', desc: 'Exception Clearance', status: 'done' }
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 uppercase">
                02 RECONCILIATION
              </span>
              {activeRec && (
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-900">
                  BATCH: {activeRec.batch_id}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
              Multi-Source Reconciliation Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-sans mt-0.5">
              Deterministic matching pipeline executing exact reference keys, fuzzy merchant distances, and AI settlement resolution.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono">
            {reconciliations.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">BATCH:</span>
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold focus:outline-none"
                >
                  {reconciliations.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.batch_id} ({formatDate(r.created_at)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setViewMode3D(!viewMode3D)}
              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider brutal-shadow-sm transition-all"
            >
              {viewMode3D ? 'HIDE 3D NETWORK' : 'VIEW 3D NETWORK'}
            </button>
          </div>
        </div>
      </div>

      {/* 3D Reconciliation Network Topology */}
      {viewMode3D && (
        <div className="space-y-2">
          <ReconciliationNetwork3D
            transactions={filteredMatches.map(m => ({
              id: m.transaction_id || m.id,
              merchant: m.bankTx?.merchant || m.gatewayTx?.merchant,
              amount: m.bankTx?.amount || m.gatewayTx?.amount || 0,
              status: m.classification === 'MATCHED' ? 'MATCHED' : 'OPEN',
              difference: (m.bankTx?.amount || 0) - (m.gatewayTx?.amount || 0)
            }))}
            selectedTxId={selectedTxId}
            onSelectTransaction={(tx) => setSelectedTxId(tx.id)}
          />
        </div>
      )}

      {/* 7-Stage Architectural Pipeline Steps */}
      <div className="p-5 bg-white border-2 border-slate-900 brutal-shadow space-y-3">
        <div className="font-mono text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5">
            <GitMerge className="w-3.5 h-3.5 text-blue-700" />
            <span>Autonomous 7-Stage Reconciliation Pipeline</span>
          </div>
          <span className="text-emerald-700 font-bold">ALL STAGES OPERATIONAL</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 font-mono">
          {pipelineStages.map((stage) => (
            <div
              key={stage.num}
              className="p-3 bg-slate-50 border border-slate-900 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-blue-700 font-bold">{stage.num}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xs font-bold text-slate-900">{stage.name}</div>
              <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">{stage.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reconciled Transactions Master Table */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">3-WAY CORRELATION MATRIX</div>
            <h2 className="text-base font-bold font-display text-slate-900">
              Reconciled Match Records ({filteredMatches.length} / {matches.length})
            </h2>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2.5 flex-wrap font-mono text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ID, Merchant, Ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 focus:outline-none font-bold"
            >
              <option value="ALL">All Classifications</option>
              <option value="MATCHED">Matched</option>
              <option value="PROBABLE_MATCH">Probable Match</option>
              <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
              <option value="MISSING_TRANSACTION">Missing Tx</option>
              <option value="DUPLICATE_TRANSACTION">Duplicate</option>
              <option value="DATE_MISMATCH">Date Mismatch</option>
              <option value="UNRESOLVED">Unresolved</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 focus:outline-none font-bold"
            >
              <option value="ALL">All Methods</option>
              <option value="EXACT_REFERENCE">Exact Ref ID</option>
              <option value="EXACT_FIELDS">Exact Fields</option>
              <option value="FUZZY_MERCHANT_AMOUNT">Fuzzy Merchant</option>
              <option value="AI_RECONCILED">AI Discrepancy</option>
              <option value="UNMATCHED">Unmatched</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border-2 border-slate-900">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-white uppercase tracking-wider font-bold border-b border-slate-900">
              <tr>
                <th className="px-4 py-3">TX ID</th>
                <th className="px-4 py-3">BANK STATEMENT</th>
                <th className="px-4 py-3">GATEWAY SETTLE</th>
                <th className="px-4 py-3">ERP LEDGER</th>
                <th className="px-4 py-3">MERCHANT / ENTITY</th>
                <th className="px-4 py-3">AMOUNT</th>
                <th className="px-4 py-3">CLASSIFICATION</th>
                <th className="px-4 py-3">CONFIDENCE</th>
                <th className="px-4 py-3">STRATEGY</th>
                <th className="px-4 py-3 text-right">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredMatches.slice(0, 60).map((m) => {
                const txId = m.bankTx?.external_transaction_id || m.gatewayTx?.external_transaction_id || m.ledgerTx?.external_transaction_id || m.id;
                const amt = m.bankTx?.amount || m.gatewayTx?.amount || m.ledgerTx?.amount || 0;
                const merchant = m.bankTx?.merchant || m.gatewayTx?.merchant || m.ledgerTx?.merchant || 'Enterprise Entity';

                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{txId}</td>
                    <td className="px-4 py-3 text-blue-700">
                      {m.bankTx ? m.bankTx.external_transaction_id : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sky-700">
                      {m.gatewayTx ? m.gatewayTx.external_transaction_id : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-indigo-700">
                      {m.ledgerTx ? m.ledgerTx.external_transaction_id : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-sans font-medium">{merchant}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(amt)}</td>
                    <td className="px-4 py-3">
                      <ClassificationBadge classification={m.classification} />
                    </td>
                    <td className="px-4 py-3">
                      <ConfidencePill confidence={m.confidence} />
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">
                      {m.matching_method}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/transactions/${m.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold border border-slate-900 transition-colors"
                      >
                        <span>VIEW</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
