import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { KpiCards } from '../components/dashboard/KpiCards.jsx';
import { DashboardCharts } from '../components/dashboard/Charts.jsx';
import { ResolveExceptionModal } from '../components/exceptions/ResolveExceptionModal.jsx';
import { SeverityBadge, ClassificationBadge, ConfidencePill, StatusBadge } from '../components/ui/Badges.jsx';
import { FinanceCore3D } from '../components/three/FinanceCore3D.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import { reconciliationService } from '../services/reconciliationService.js';
import { exceptionService } from '../services/allServices.js';
import {
  Play,
  UploadCloud,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function Dashboard({ refreshTrigger, onRefresh }) {
  const [metrics, setMetrics] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);
  const [recentExceptions, setRecentExceptions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedException, setSelectedException] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [show3DTopology, setShow3DTopology] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const metricsData = await reconciliationService.getMetrics('latest');
      if (metricsData.success && metricsData.data) {
        setMetrics(metricsData.data);
      }

      const recsData = await reconciliationService.getAllReconciliations();
      if (recsData.success && recsData.data?.length > 0) {
        const latest = recsData.data[0];
        setReconciliation(latest);

        const recDetail = await reconciliationService.getReconciliationById(latest.id);
        if (recDetail.success && recDetail.data) {
          setMatches(recDetail.data.matches || []);
        }
      }

      const exData = await exceptionService.getAllExceptions({ limit: 6, status: 'ALL' });
      if (exData.success && exData.data) {
        setRecentExceptions(exData.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  const handleRunDemo = async () => {
    try {
      setIsRunningDemo(true);
      await reconciliationService.runDemo();
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.2 } });
      } catch {}
      if (onRefresh) onRefresh();
      await fetchDashboardData();
    } catch (e) {
      console.error('Demo execution error:', e);
    } finally {
      setIsRunningDemo(false);
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset all reconciliation and exception data back to baseline?')) {
      await reconciliationService.resetDemo();
      if (onRefresh) onRefresh();
      await fetchDashboardData();
    }
  };

  const handleReviewException = (ex) => {
    setSelectedException(ex);
    setIsResolveModalOpen(true);
  };

  const handleExceptionResolved = async () => {
    await fetchDashboardData();
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-8">
      {/* Editorial Page Header & Control Strip */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 uppercase">
                01 OVERVIEW
              </span>
              {reconciliation && (
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-900">
                  BATCH: {reconciliation.batch_id}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
              Reconciliation & Cash Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-sans mt-0.5">
              Live multi-source matching, straight-through resolution metrics, and automated ledger variance triage.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5 flex-wrap font-mono">
            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 brutal-shadow-sm transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleRunDemo}
              disabled={isRunningDemo}
              id="dashboard-run-demo-btn"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider border-2 border-slate-900 brutal-shadow transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isRunningDemo ? 'animate-spin' : ''}`} />
              <span>{isRunningDemo ? 'PROCESSING...' : 'RUN BATCH RECON'}</span>
            </button>

            <Link
              to="/data"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold uppercase tracking-wider border-2 border-slate-900 brutal-shadow-sm transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>DATA INGESTION</span>
            </Link>

            <button
              onClick={handleResetDemo}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider border border-slate-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 Dynamic KPI Metric Cards */}
      <KpiCards metrics={metrics} />

      {/* Live 3D Multi-Source Pulse Strip & Ingestion Status */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-700" />
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">REAL-TIME FINANCIAL PIPELINE</span>
              <h2 className="text-base font-bold font-display text-slate-900">3-Way Balance Topology & Stream Status</h2>
            </div>
          </div>

          <button
            onClick={() => setShow3DTopology(!show3DTopology)}
            className="text-xs font-mono font-bold px-2.5 py-1 border border-slate-900 bg-slate-50 hover:bg-slate-100 text-slate-900"
          >
            {show3DTopology ? 'HIDE 3D TOPOLOGY' : 'VIEW 3D TOPOLOGY'}
          </button>
        </div>

        {show3DTopology && (
          <div className="w-full h-72 sm:h-80 bg-slate-50 border border-slate-900 relative">
            <FinanceCore3D interactive={true} />
            <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 border border-slate-900 text-[10px] font-mono text-slate-700">
              BANK STATEMENT (42%) • GATEWAY SETTLEMENT (38%) • GENERAL LEDGER (20%)
            </div>
          </div>
        )}
      </div>

      {/* Visual Analytics & Breakdown Charts */}
      <DashboardCharts metrics={metrics} matches={matches} exceptions={recentExceptions} />

      {/* Priority Exceptions Action Center */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-700 uppercase">HUMAN-IN-THE-LOOP TRIAGE</span>
              <h2 className="text-base font-bold font-display text-slate-900">Priority Exception Queue</h2>
            </div>
          </div>

          <Link
            to="/exceptions"
            className="flex items-center gap-1 font-mono text-xs font-bold text-blue-700 hover:text-blue-900 underline underline-offset-4"
          >
            <span>EXPLORE ALL EXCEPTIONS ({metrics?.exception_count || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentExceptions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-sm font-bold font-mono text-slate-900 uppercase">Zero Open Exceptions</div>
            <p className="text-xs text-slate-600 mt-1">All processed records are reconciled. Click "Run Batch Recon" to process records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase font-mono tracking-wider font-bold border-b border-slate-900">
                <tr>
                  <th className="px-4 py-3">TX ID</th>
                  <th className="px-4 py-3">TYPE</th>
                  <th className="px-4 py-3">MERCHANT / ENTITY</th>
                  <th className="px-4 py-3">AMOUNT</th>
                  <th className="px-4 py-3">VARIANCE</th>
                  <th className="px-4 py-3">CONFIDENCE</th>
                  <th className="px-4 py-3">SEVERITY</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-mono">
                {recentExceptions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{ex.transaction_id}</td>
                    <td className="px-4 py-3">
                      <ClassificationBadge classification={ex.type} />
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-sans font-medium">
                      {ex.bankTx?.merchant || ex.gatewayTx?.merchant || 'Enterprise Entity'}
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
                        onClick={() => handleReviewException(ex)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-mono text-[11px] font-bold uppercase tracking-wider brutal-shadow-sm transition-all cursor-pointer"
                      >
                        REVIEW
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
          onResolved={handleExceptionResolved}
        />
      )}
    </div>
  );
}
