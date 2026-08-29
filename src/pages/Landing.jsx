import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileSpreadsheet,
  GitMerge,
  Eye,
  Bot,
  Activity,
  Lock,
  Layers,
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { FinanceCore3D } from '../components/three/FinanceCore3D.jsx';
import { reconciliationService } from '../services/reconciliationService.js';
import confetti from 'canvas-confetti';

export function Landing({ onRefresh }) {
  const navigate = useNavigate();
  const [isRunningDemo, setIsRunningDemo] = useState(false);

  const handleRunDemo = async () => {
    try {
      setIsRunningDemo(true);
      await reconciliationService.runDemo();
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.25 } });
      } catch {}
      if (onRefresh) onRefresh();
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      navigate('/dashboard');
    } finally {
      setIsRunningDemo(false);
    }
  };

  return (
    <div className="space-y-16 py-4 sm:py-8">
      {/* Hero Section with 3D Financial Core */}
      <section className="bg-white border-2 border-slate-900 brutal-shadow-lg p-6 sm:p-10 relative overflow-hidden">
        {/* Top Identification Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900 pb-4 mb-8 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-slate-900 text-white px-2 py-0.5 font-bold uppercase tracking-wider">
              ENTERPRISE EDITION
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-800 font-bold">SYSTEM ARCHITECTURE: 3-WAY MULTI-VECTOR RECONCILIATION</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>PRODUCTION VERIFIED</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Editorial Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <span className="font-mono text-xs font-bold text-blue-700 tracking-widest uppercase">
                AUTOMATED LEDGER GOVERNANCE & CASH ASSURANCE
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 font-display leading-[1.08]">
                Run the Books. <br />
                Control the Cash. <br />
                <span className="text-blue-700">Catch the Exceptions.</span>
              </h1>
            </div>

            <p className="text-sm sm:text-base text-slate-700 max-w-xl font-normal leading-relaxed">
              Enterprise financial reconciliation engine combining deterministic rule-based matching, 
              Gemini AI anomaly diagnostics, and real-time cash position intelligence across Bank Statements, 
              Payment Gateways, and ERP Ledgers.
            </p>

            {/* Live Metrics Grid within Hero */}
            <div className="grid grid-cols-3 gap-3 pt-2 font-mono">
              <div className="p-3 bg-slate-50 border border-slate-900 brutal-shadow-sm">
                <div className="text-[10px] text-slate-500 uppercase font-bold">MATCH ACCURACY</div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">99.4%</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Exact & Fuzzy</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-900 brutal-shadow-sm">
                <div className="text-[10px] text-slate-500 uppercase font-bold">AUTO STP RATE</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-700 mt-0.5">94.2%</div>
                <div className="text-[10px] text-blue-600 font-semibold">Zero-Touch</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-900 brutal-shadow-sm">
                <div className="text-[10px] text-slate-500 uppercase font-bold">LATENCY / 1K TX</div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">&lt; 2.4s</div>
                <div className="text-[10px] text-slate-600 font-semibold">Real-Time</div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/dashboard"
                id="enter-control-center-btn"
                className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider border-2 border-slate-900 brutal-shadow transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                <span>ENTER CONTROL CENTER</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={handleRunDemo}
                disabled={isRunningDemo}
                id="hero-run-demo-btn"
                className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs uppercase tracking-wider border-2 border-slate-900 brutal-shadow transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 fill-current ${isRunningDemo ? 'animate-spin' : ''}`} />
                <span>{isRunningDemo ? 'PROCESSING BATCH...' : 'RUN LIVE DEMO'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: 3D Financial Core Canvas */}
          <div className="lg:col-span-5 relative">
            <div className="w-full h-[360px] sm:h-[440px] bg-slate-100 border-2 border-slate-900 brutal-shadow relative">
              <FinanceCore3D interactive={true} />
              <div className="absolute top-2 right-2 bg-white/90 px-2.5 py-1 border border-slate-900 text-[10px] font-mono font-bold text-slate-800">
                3D FINANCIAL TOPOLOGY CORE
              </div>
              <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 border border-slate-900 text-[9px] font-mono text-slate-600">
                DRAG TO ROTATE • LIVE NODE STREAM
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Way Reconciled Data Sources Breakdown */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-2 border-slate-900 pb-3">
          <div>
            <span className="font-mono text-xs font-bold text-blue-700 uppercase tracking-widest">
              MULTI-VECTOR MATCHING
            </span>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              The 3-Source Reconciliation Architecture
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-500">
            DETERMINISTIC + SEMANTIC VERIFICATION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Source 1: Bank Statements */}
          <div className="bg-white border-2 border-slate-900 brutal-shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200">
                SOURCE 01
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">HDFC / ICICI / HSBC</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Bank Statement Feeds</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ingests raw MT940 / CSV bank statements, extracts standard reference codes, parses fee withholdings, 
              and establishes ground-truth cleared balances.
            </p>
            <div className="pt-2 font-mono text-[11px] text-slate-700 bg-slate-50 p-2.5 border border-slate-300">
              Field Matrix: <code>Date, UTR, RefNum, Debits, Credits, Balance</code>
            </div>
          </div>

          {/* Source 2: Payment Gateways */}
          <div className="bg-white border-2 border-slate-900 brutal-shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 border border-sky-200">
                SOURCE 02
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">Stripe / Razorpay / Adyen</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Gateway Settlement Logs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Normalizes transaction gross vs net settlement, MDR commission deductions, rolling reserve holds, 
              and refund reversals across all checkout channels.
            </p>
            <div className="pt-2 font-mono text-[11px] text-slate-700 bg-slate-50 p-2.5 border border-slate-300">
              Field Matrix: <code>PaymentId, Gross, Fee, Tax, Net, BatchId</code>
            </div>
          </div>

          {/* Source 3: ERP General Ledger */}
          <div className="bg-white border-2 border-slate-900 brutal-shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 border border-indigo-200">
                SOURCE 03
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">SAP / NetSuite / Tally</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">General Ledger Records</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Binds enterprise journal voucher numbers, accounts receivable allocations, tax line entries, 
              and internal customer invoices to settle books cleanly.
            </p>
            <div className="pt-2 font-mono text-[11px] text-slate-700 bg-slate-50 p-2.5 border border-slate-300">
              Field Matrix: <code>InvoiceId, VoucherNum, Customer, Amount, GL Code</code>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Forensic Transaction Comparison Box */}
      <section className="bg-white border-2 border-slate-900 brutal-shadow p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-slate-900">
          <div>
            <span className="font-mono text-xs font-bold text-slate-500 uppercase">
              LIVE MULTI-SOURCE FORENSIC INSPECTOR
            </span>
            <h3 className="text-xl font-bold font-display text-slate-900">
              Side-by-Side 3-Way Match Demonstration
            </h3>
          </div>
          <Link
            to="/transactions"
            className="flex items-center gap-1 font-mono text-xs font-bold text-blue-700 hover:text-blue-900 underline underline-offset-4"
          >
            <span>Explore All Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border-2 border-slate-900 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-blue-800">
              <span>HDFC Bank Statement</span>
              <span>BANK-TX-1044</span>
            </div>
            <div className="text-base font-bold text-slate-900 font-mono">₹45,000.00</div>
            <div className="text-xs text-slate-600">Merchant: Reliance Retail Pvt Ltd</div>
            <div className="text-[11px] font-mono text-slate-500">Ref: REF-RR-8821 • 2026-08-28</div>
          </div>

          <div className="p-4 bg-slate-50 border-2 border-amber-600 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-800">
              <span>Razorpay Settlement</span>
              <span className="bg-amber-100 text-amber-900 px-1 border border-amber-300">₹90 Fee Diff</span>
            </div>
            <div className="text-base font-bold text-slate-900 font-mono">₹44,910.00 <span className="text-xs text-slate-500 font-normal">(Net)</span></div>
            <div className="text-xs text-slate-600">Merchant: Reliance Retail Direct</div>
            <div className="text-[11px] font-mono text-slate-500">Ref: REF-RR-8821 • 2026-08-28</div>
          </div>

          <div className="p-4 bg-slate-50 border-2 border-slate-900 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-indigo-800">
              <span>SAP General Ledger</span>
              <span>LED-TX-9011</span>
            </div>
            <div className="text-base font-bold text-slate-900 font-mono">₹45,000.00</div>
            <div className="text-xs text-slate-600">Customer: Reliance Retail Enterprise</div>
            <div className="text-[11px] font-mono text-slate-500">Ref: REF-RR-8821 • 2026-08-28</div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border-2 border-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-700 shrink-0" />
            <div className="text-xs text-slate-800">
              <strong className="font-mono text-blue-900">AI FORENSIC VERDICT:</strong> High confidence 3-way match (96%). ₹90.00 Razorpay MDR fee withholding identified. Flagged for automated fee account write-off.
            </div>
          </div>
          <Link
            to="/exceptions"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold whitespace-nowrap brutal-shadow-sm transition-all"
          >
            Review In Exceptions
          </Link>
        </div>
      </section>

      {/* Enterprise Security & Governance Features */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-white border-2 border-slate-900 brutal-shadow">
          <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>DETERMINISTIC ENGINE</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
            Strict tolerance thresholds, reference matching, and token-based similarity prevent phantom reconciliations.
          </p>
        </div>

        <div className="p-4 bg-white border-2 border-slate-900 brutal-shadow">
          <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-700" />
            <span>IMMUTABLE AUDIT LOG</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
            Every resolution, rule override, and approval is cryptographically logged with actor timestamp.
          </p>
        </div>

        <div className="p-4 bg-white border-2 border-slate-900 brutal-shadow">
          <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-700" />
            <span>CASH LIQUIDITY</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
            Real-time calculation of cleared cash, pending gateway settlements, and unreconciled float risk.
          </p>
        </div>

        <div className="p-4 bg-white border-2 border-slate-900 brutal-shadow">
          <div className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-700" />
            <span>GEMINI DIAGNOSTICS</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
            Automated root-cause analysis and financial impact estimation on complex date lags and amount variances.
          </p>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-slate-900 text-white border-2 border-slate-900 brutal-shadow-lg p-8 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Ready to Reconcile the Current Financial Period?
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto font-light">
          Trigger the full deterministic and AI-powered reconciliation pipeline across all ingested transaction streams.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 font-mono">
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider brutal-shadow-sm transition-all"
          >
            OPEN RECONCILIATION DASHBOARD
          </Link>
          <Link
            to="/reports"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider border border-slate-600 transition-all"
          >
            VIEW AUDIT REPORT
          </Link>
        </div>
      </section>
    </div>
  );
}
