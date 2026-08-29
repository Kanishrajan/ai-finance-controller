import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Radar,
  ArrowRight
} from 'lucide-react';
import { exceptionService } from '../services/allServices.js';
import { ResolveExceptionModal } from '../components/exceptions/ResolveExceptionModal.jsx';
import { SeverityBadge, ClassificationBadge, ConfidencePill, StatusBadge } from '../components/ui/Badges.jsx';
import { ExceptionCluster3D } from '../components/three/ExceptionCluster3D.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatDate } from '../utils/formatDate.js';

export function Exceptions({ refreshTrigger, onRefresh }) {
  const [exceptions, setExceptions] = useState([]);
  const [counts, setCounts] = useState({ total: 0, open: 0, resolved: 0, rejected: 0 });
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedException, setSelectedException] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [show3DRadar, setShow3DRadar] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExceptions = async () => {
    try {
      setIsLoading(true);
      const res = await exceptionService.getAllExceptions({
        status: selectedStatus,
        type: selectedType,
        severity: selectedSeverity,
        search: searchQuery,
        limit: 100
      });

      if (res.success && res.data) {
        setExceptions(res.data);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err) {
      console.error('Error fetching exceptions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [selectedStatus, selectedType, selectedSeverity, searchQuery, refreshTrigger]);

  const handleReview = (ex) => {
    setSelectedException(ex);
    setIsResolveModalOpen(true);
  };

  const handleResolved = async () => {
    await fetchExceptions();
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-300 uppercase">
                04 EXCEPTIONS
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-900">
                ACTIVE QUEUE: {counts.open} PENDING
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
              Financial Exception Resolution Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-sans mt-0.5">
              Review ledger discrepancies, gateway MDR fee withholdings, duplicate attempts, and AI diagnostic insights.
            </p>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap font-mono">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-slate-900 transition-all ${
                selectedStatus === 'ALL'
                  ? 'bg-slate-900 text-white brutal-shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              ALL: {counts.total}
            </button>
            <button
              onClick={() => setSelectedStatus('OPEN')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-amber-600 transition-all ${
                selectedStatus === 'OPEN'
                  ? 'bg-amber-600 text-white brutal-shadow-sm'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              OPEN: {counts.open}
            </button>
            <button
              onClick={() => setSelectedStatus('RESOLVED')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-emerald-600 transition-all ${
                selectedStatus === 'RESOLVED'
                  ? 'bg-emerald-700 text-white brutal-shadow-sm'
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              RESOLVED: {counts.resolved}
            </button>
            <button
              onClick={() => setSelectedStatus('REJECTED')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-rose-600 transition-all ${
                selectedStatus === 'REJECTED'
                  ? 'bg-rose-700 text-white brutal-shadow-sm'
                  : 'bg-rose-50 text-rose-900 hover:bg-rose-100'
              }`}
            >
              REJECTED: {counts.rejected}
            </button>
          </div>
        </div>
      </div>

      {/* 3D Exception Severity Cluster */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-700 uppercase">3D SEVERITY & RISK MATRIX</span>
            <h2 className="text-base font-bold font-display text-slate-900">Exception Spatial Cluster & Proximity</h2>
          </div>
          <button
            onClick={() => setShow3DRadar(!show3DRadar)}
            className="text-xs font-mono font-bold px-2.5 py-1 border border-slate-900 bg-slate-50 hover:bg-slate-100 text-slate-900"
          >
            {show3DRadar ? 'HIDE 3D RADAR' : 'SHOW 3D RADAR'}
          </button>
        </div>

        {show3DRadar && (
          <ExceptionCluster3D
            exceptions={exceptions.map(e => ({
              id: e.transaction_id || e.id,
              type: e.type,
              severity: e.severity,
              amount: e.amount || 0,
              merchant: e.bankTx?.merchant || e.gatewayTx?.merchant
            }))}
            selectedId={selectedException?.id}
            onSelectException={(ex) => {
              const fullEx = exceptions.find(e => (e.transaction_id || e.id) === ex.id);
              if (fullEx) handleReview(fullEx);
            }}
          />
        )}
      </div>

      {/* Main Exception Table Container */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6 space-y-4">
        {/* Multi-Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4 font-mono text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, merchant, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 focus:outline-none font-bold"
            >
              <option value="ALL">All Types</option>
              <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
              <option value="MISSING_TRANSACTION">Missing Tx</option>
              <option value="DUPLICATE_TRANSACTION">Duplicate</option>
              <option value="DATE_MISMATCH">Date Mismatch</option>
              <option value="LOW_CONFIDENCE">Low Confidence</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 focus:outline-none font-bold"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical (₹10,000+)</option>
              <option value="HIGH">High (₹1,000+)</option>
              <option value="MEDIUM">Medium (₹100+)</option>
              <option value="LOW">Low (&lt;₹100)</option>
            </select>
          </div>
        </div>

        {exceptions.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 border border-slate-300">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <div className="text-base font-bold font-mono text-slate-900 uppercase">No Exceptions Found</div>
            <p className="text-xs text-slate-600 mt-1">No items match your active filter parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-slate-900">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-white uppercase tracking-wider font-bold border-b border-slate-900">
                <tr>
                  <th className="px-4 py-3">TRANSACTION ID</th>
                  <th className="px-4 py-3">TYPE</th>
                  <th className="px-4 py-3">MERCHANT / COUNTERPARTY</th>
                  <th className="px-4 py-3">AMOUNT</th>
                  <th className="px-4 py-3">VARIANCE</th>
                  <th className="px-4 py-3">CONFIDENCE</th>
                  <th className="px-4 py-3">SEVERITY</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {exceptions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{ex.transaction_id}</td>
                    <td className="px-4 py-3">
                      <ClassificationBadge classification={ex.type} />
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-sans font-medium">
                      {ex.bankTx?.merchant || ex.gatewayTx?.merchant || 'Enterprise Party'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {formatCurrency(ex.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {ex.difference !== 0 ? (
                        <span className="text-amber-700 font-bold">₹{Math.abs(ex.difference).toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ConfidencePill confidence={ex.confidence} />
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={ex.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ex.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleReview(ex)}
                        className={`px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider border-2 border-slate-900 brutal-shadow-sm transition-all cursor-pointer ${
                          ex.status === 'OPEN'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                        }`}
                      >
                        {ex.status === 'OPEN' ? 'RESOLVE' : 'AUDIT'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exception Resolution Modal */}
      {selectedException && (
        <ResolveExceptionModal
          exception={selectedException}
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          onResolved={handleResolved}
        />
      )}
    </div>
  );
}
