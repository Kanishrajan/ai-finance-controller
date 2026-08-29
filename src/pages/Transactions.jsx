import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ListOrdered,
  Search,
  Filter,
  ArrowUpRight,
  Download,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { reconciliationService } from '../services/reconciliationService.js';
import { ClassificationBadge, ConfidencePill, StatusBadge } from '../components/ui/Badges.jsx';
import { TransactionNetwork3D } from '../components/three/TransactionNetwork3D.jsx';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatDate } from '../utils/formatDate.js';

export function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | '3d'
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const res = await reconciliationService.getAllTransactions({ limit: 100 });
      if (res.success && res.data) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    if (sourceFilter !== 'ALL' && tx.source !== sourceFilter) return false;
    if (statusFilter !== 'ALL' && tx.match_status !== statusFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const id = tx.external_transaction_id?.toLowerCase() || tx.id?.toLowerCase() || '';
      const m = tx.merchant?.toLowerCase() || '';
      const ref = tx.reference_id?.toLowerCase() || '';
      return id.includes(q) || m.includes(q) || ref.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 uppercase">
                03 TRANSACTIONS
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-900">
                TOTAL: {transactions.length} RECORDS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
              Universal Transaction Explorer
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-sans mt-0.5">
              Granular multi-source ledger explorer covering bank cleared debits/credits, gateway settlements, and ERP vouchers.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? '3d' : 'table')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider brutal-shadow-sm transition-all"
            >
              {viewMode === 'table' ? 'SWITCH TO 3D TOPOLOGY' : 'SWITCH TO DATA TABLE'}
            </button>
            <button
              onClick={fetchTransactions}
              className="p-2 bg-slate-100 border border-slate-900 hover:bg-slate-200 text-slate-900"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Visualization Mode */}
      {viewMode === '3d' && (
        <div className="space-y-2">
          <TransactionNetwork3D
            transactions={filteredTransactions.map(t => ({
              id: t.external_transaction_id || t.id,
              amount: t.amount || 0,
              status: t.match_status || 'MATCHED',
              source: t.source
            }))}
          />
        </div>
      )}

      {/* Main Data Table View */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Tx ID, Merchant, Ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 focus:outline-none font-bold"
            >
              <option value="ALL">All Sources</option>
              <option value="BANK">Bank Statements</option>
              <option value="GATEWAY">Payment Gateways</option>
              <option value="LEDGER">General Ledger</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 focus:outline-none font-bold"
            >
              <option value="ALL">All Statuses</option>
              <option value="MATCHED">Matched</option>
              <option value="PROBABLE_MATCH">Probable Match</option>
              <option value="UNRESOLVED">Unresolved</option>
            </select>
          </div>

          <div className="text-slate-500 font-bold">
            SHOWING {filteredTransactions.length} OF {transactions.length} RECORDS
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border-2 border-slate-900">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-white uppercase tracking-wider font-bold border-b border-slate-900">
              <tr>
                <th className="px-4 py-3">EXTERNAL ID</th>
                <th className="px-4 py-3">SOURCE</th>
                <th className="px-4 py-3">MERCHANT / COUNTERPARTY</th>
                <th className="px-4 py-3">AMOUNT</th>
                <th className="px-4 py-3">REFERENCE KEY</th>
                <th className="px-4 py-3">POSTING DATE</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredTransactions.slice(0, 60).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{tx.external_transaction_id || tx.id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                      tx.source === 'BANK' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                      tx.source === 'GATEWAY' ? 'bg-sky-50 text-sky-800 border-sky-300' :
                      'bg-indigo-50 text-indigo-800 border-indigo-300'
                    }`}>
                      {tx.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-sans font-medium">{tx.merchant || 'N/A'}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(tx.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{tx.reference_id || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(tx.transaction_date || tx.created_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tx.match_status || 'MATCHED'} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/transactions/${tx.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold border border-slate-900 transition-colors"
                    >
                      <span>INSPECT</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
