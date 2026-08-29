import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  User,
  Clock,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Lock
} from 'lucide-react';
import { auditService } from '../services/allServices.js';
import { formatDateTime } from '../utils/formatDate.js';

export function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await auditService.getAuditLogs(150);
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const user = l.user_name?.toLowerCase() || '';
      const act = l.action?.toLowerCase() || '';
      const det = l.details?.toLowerCase() || '';
      const entity = l.entity_id?.toLowerCase() || '';
      return user.includes(q) || act.includes(q) || det.includes(q) || entity.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-300 uppercase">
                07 AUDIT TRAIL
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-900">
                IMMUTABLE SHA-256 LOG
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
              Immutable Governance & Audit Trail
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-sans mt-0.5">
              Append-only event record tracking every reconciliation run, manual resolution decision, and rule configuration change.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-mono font-bold uppercase tracking-wider border-2 border-slate-900 brutal-shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>REFRESH TRAIL</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table Container */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 font-mono text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, action, details, entity ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 focus:outline-none font-bold"
          >
            <option value="ALL">All Actions</option>
            <option value="DATASET_UPLOADED">DATASET_UPLOADED</option>
            <option value="RECONCILIATION_STARTED">RECONCILIATION_STARTED</option>
            <option value="RECONCILIATION_COMPLETED">RECONCILIATION_COMPLETED</option>
            <option value="EXCEPTION_RESOLVED">EXCEPTION_RESOLVED</option>
            <option value="DEMO_DATA_INITIALIZED">DEMO_DATA_INITIALIZED</option>
          </select>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 border border-slate-300">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <div className="text-base font-bold font-mono text-slate-900 uppercase">No Logs Recorded</div>
            <p className="text-xs text-slate-600 mt-1">Run a batch or make an exception decision to generate events.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-slate-900">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-white uppercase tracking-wider font-bold border-b border-slate-900">
                <tr>
                  <th className="px-4 py-3">TIMESTAMP</th>
                  <th className="px-4 py-3">ACTOR / PERSONA</th>
                  <th className="px-4 py-3">ACTION EVENT</th>
                  <th className="px-4 py-3">ENTITY TARGET</th>
                  <th className="px-4 py-3">AUDIT RATIONALE / DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap font-bold">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.user_name}</div>
                      <span className="inline-block px-1.5 py-0.2 border border-slate-900 text-[9px] bg-slate-100 text-slate-900 font-bold mt-0.5">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-700">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.entity_type} ({log.entity_id?.slice(0, 10)}...)
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-sans text-xs max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
