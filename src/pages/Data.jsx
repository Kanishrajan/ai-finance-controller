import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Search,
  Filter,
  Database,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { datasetService } from '../services/allServices.js';
import { reconciliationService } from '../services/reconciliationService.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatDate } from '../utils/formatDate.js';
import confetti from 'canvas-confetti';

export function Data({ onRefresh }) {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [selectedSourceType, setSelectedSourceType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDatasets = async () => {
    try {
      setIsLoading(true);
      const res = await datasetService.getAllDatasets();
      if (res.success && res.data) {
        setDatasets(res.data);
      }

      const txRes = await reconciliationService.getAllTransactions({ limit: 100 });
      if (txRes.success && txRes.data) {
        setAllTransactions(txRes.data);
      }
    } catch (err) {
      console.error('Error fetching datasets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleFileUpload = (sourceType, file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadFeedback(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: async (results) => {
        try {
          const payload = {
            name: `${sourceType} Ingestion (${file.name})`,
            sourceType,
            records: results.data
          };

          const res = await datasetService.uploadDataset(payload);
          setUploadFeedback({
            type: 'success',
            message: `Successfully ingested ${res.data.record_count} records from ${file.name}.`
          });
          await fetchDatasets();
          if (onRefresh) onRefresh();
        } catch (err) {
          setUploadFeedback({
            type: 'error',
            message: err.response?.data?.error?.message || 'Failed to parse and upload CSV.'
          });
        } finally {
          setIsUploading(false);
        }
      },
      error: (err) => {
        setIsUploading(false);
        setUploadFeedback({
          type: 'error',
          message: `CSV parsing error: ${err.message}`
        });
      }
    });
  };

  const handleLoadDemoDatasets = async () => {
    try {
      setIsUploading(true);
      await reconciliationService.runDemo();
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.2 } });
      } catch (e) {}
      await fetchDatasets();
      if (onRefresh) onRefresh();
      setUploadFeedback({
        type: 'success',
        message: 'Successfully loaded synthetic benchmark datasets across Bank, Gateway, and Ledger.'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredTx = allTransactions.filter((tx) => {
    if (selectedSourceType !== 'ALL' && tx.source_type !== selectedSourceType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const merchant = tx.merchant?.toLowerCase() || '';
      const id = tx.external_transaction_id?.toLowerCase() || '';
      const ref = tx.reference_id?.toLowerCase() || '';
      return merchant.includes(q) || id.includes(q) || ref.includes(q);
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
                DATA INGESTION
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-900">
                ACTIVE DATASETS: {datasets.length}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
              Financial Data Ingestion & Schema Normalizer
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-sans mt-0.5">
              Multi-source ingestion for bank statements (MT940/CSV), payment gateways, and ERP general ledgers.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <button
              onClick={handleLoadDemoDatasets}
              disabled={isUploading}
              id="data-load-demo-btn"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider border-2 border-slate-900 brutal-shadow transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isUploading ? 'INGESTING...' : 'LOAD SYNTHETIC SUITE'}</span>
            </button>
          </div>
        </div>
      </div>

      {uploadFeedback && (
        <div className={`p-4 border-2 font-mono text-xs font-bold flex items-center gap-3 brutal-shadow-sm ${
          uploadFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-700' : 'bg-rose-50 text-rose-900 border-rose-700'
        }`}>
          {uploadFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />}
          <span>{uploadFeedback.message}</span>
        </div>
      )}

      {/* 3 Source Ingestion Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Source 1: Bank */}
        <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 uppercase">
                SOURCE 01
              </span>
              <FileSpreadsheet className="w-5 h-5 text-blue-700" />
            </div>
            <h3 className="text-base font-bold font-display text-slate-900">Bank Statement Feeds</h3>
            <p className="text-xs text-slate-600 mt-1">
              Direct banking settlement records (HDFC, ICICI, Citi, HSBC).
            </p>
          </div>

          <label className="border-2 border-dashed border-slate-900 hover:bg-slate-50 p-4 text-center cursor-pointer transition-colors block bg-slate-50/50">
            <UploadCloud className="w-6 h-6 text-slate-700 mx-auto mb-1" />
            <span className="font-mono text-xs font-bold text-slate-900 uppercase block">Upload Bank CSV</span>
            <span className="text-[10px] text-slate-500 font-mono block">or drag and drop</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFileUpload('BANK', e.target.files[0])}
            />
          </label>
        </div>

        {/* Source 2: Gateway */}
        <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 border border-sky-200 uppercase">
                SOURCE 02
              </span>
              <FileSpreadsheet className="w-5 h-5 text-sky-700" />
            </div>
            <h3 className="text-base font-bold font-display text-slate-900">Payment Gateway Logs</h3>
            <p className="text-xs text-slate-600 mt-1">
              Captured authorizations & fees (Razorpay, Stripe, Adyen).
            </p>
          </div>

          <label className="border-2 border-dashed border-slate-900 hover:bg-slate-50 p-4 text-center cursor-pointer transition-colors block bg-slate-50/50">
            <UploadCloud className="w-6 h-6 text-slate-700 mx-auto mb-1" />
            <span className="font-mono text-xs font-bold text-slate-900 uppercase block">Upload Gateway CSV</span>
            <span className="text-[10px] text-slate-500 font-mono block">or drag and drop</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFileUpload('PAYMENT_GATEWAY', e.target.files[0])}
            />
          </label>
        </div>

        {/* Source 3: Ledger */}
        <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 border border-indigo-200 uppercase">
                SOURCE 03
              </span>
              <FileSpreadsheet className="w-5 h-5 text-indigo-700" />
            </div>
            <h3 className="text-base font-bold font-display text-slate-900">General Ledger (ERP)</h3>
            <p className="text-xs text-slate-600 mt-1">
              Accounting journal entries (SAP, Oracle NetSuite, Tally).
            </p>
          </div>

          <label className="border-2 border-dashed border-slate-900 hover:bg-slate-50 p-4 text-center cursor-pointer transition-colors block bg-slate-50/50">
            <UploadCloud className="w-6 h-6 text-slate-700 mx-auto mb-1" />
            <span className="font-mono text-xs font-bold text-slate-900 uppercase block">Upload Ledger CSV</span>
            <span className="text-[10px] text-slate-500 font-mono block">or drag and drop</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFileUpload('INTERNAL_LEDGER', e.target.files[0])}
            />
          </label>
        </div>
      </div>

      {/* Ingested Datasets Summary Cards */}
      <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">INGESTION REGISTRY</div>
          <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-700" />
            <span>Active Financial Datasets in Memory ({datasets.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
          {datasets.map((ds) => (
            <div key={ds.id} className="p-4 bg-slate-50 border-2 border-slate-900 brutal-shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 truncate">{ds.name}</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold border border-slate-900 bg-white text-slate-900">
                  {ds.source_type}
                </span>
              </div>
              <div className="text-xs text-slate-600 flex items-center justify-between">
                <span>{ds.record_count} records</span>
                <span className="font-bold text-slate-900">{formatCurrency(ds.total_value)}</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                Uploaded: {formatDate(ds.created_at)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Normalized Records Explorer Table */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 font-mono text-xs">
          <div>
            <div className="text-[10px] font-bold text-blue-700 uppercase">NORMALIZED PIPELINE STREAM</div>
            <h2 className="text-base font-bold font-display text-slate-900">
              Ingested & Normalized Transaction Stream
            </h2>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search merchant, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-900 text-slate-900 focus:outline-none font-bold"
            >
              <option value="ALL">All Sources</option>
              <option value="BANK">Bank Statements</option>
              <option value="PAYMENT_GATEWAY">Payment Gateways</option>
              <option value="INTERNAL_LEDGER">General Ledger</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border-2 border-slate-900">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-white uppercase tracking-wider font-bold border-b border-slate-900">
              <tr>
                <th className="px-4 py-3">EXTERNAL ID</th>
                <th className="px-4 py-3">SOURCE</th>
                <th className="px-4 py-3">RAW MERCHANT</th>
                <th className="px-4 py-3">NORMALIZED CLEAN</th>
                <th className="px-4 py-3">AMOUNT</th>
                <th className="px-4 py-3">DATE</th>
                <th className="px-4 py-3">REFERENCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredTx.slice(0, 30).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{tx.external_transaction_id}</td>
                  <td className="px-4 py-3">
                    <span className="px-1.5 py-0.5 border border-slate-900 text-[10px] font-bold bg-slate-100 text-slate-900">
                      {tx.source_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-sans font-medium">{tx.merchant}</td>
                  <td className="px-4 py-3 text-blue-700 font-bold">{tx.normalized_merchant}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(tx.amount, tx.currency)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(tx.transaction_date)}</td>
                  <td className="px-4 py-3 text-slate-500">{tx.reference_id || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
