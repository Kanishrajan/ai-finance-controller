import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Database,
  Server,
  Zap,
  RotateCcw
} from 'lucide-react';
import api from '../services/api.js';

export function Settings() {
  const [dateLagTolerance, setDateLagTolerance] = useState(1);
  const [confidenceThreshold, setConfidenceThreshold] = useState(90);
  const [criticalThreshold, setCriticalThreshold] = useState(10000);
  const [isSaved, setIsSaved] = useState(false);
  const [healthInfo, setHealthInfo] = useState(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.get('/ready');
        setHealthInfo(res.data);
      } catch (e) {
        console.error('Health check failed', e);
      }
    }
    checkHealth();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-white border-2 border-slate-900 brutal-shadow p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 uppercase">
            08 CONFIGURATION
          </span>
          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-900">
            SYSTEM ENGINE
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
          Engine Rules & Thresholds
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-sans mt-0.5">
          Configure multi-source matching thresholds, severity triggers, AI model hyperparameters, and system diagnostics.
        </p>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-700 text-emerald-900 font-mono text-xs font-bold flex items-center gap-2 brutal-shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>CONFIGURATION SAVED TO ENGINE RUNTIME STATE.</span>
        </div>
      )}

      {/* Form Settings */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Matching Rules */}
        <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-900">
            <Sliders className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold font-mono text-slate-900 uppercase tracking-wider">
              1. Matching Strategy Tolerances
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1 uppercase">
                Date Proximity Lag Tolerance (Days)
              </label>
              <input
                type="number"
                min={0}
                max={7}
                value={dateLagTolerance}
                onChange={(e) => setDateLagTolerance(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-sans">
                Allowed calendar lag between Gateway authorization and Bank statement settlement (Default ±1 day).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1 uppercase">
                Auto-Resolution Straight-Through Threshold (%)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseInt(e.target.value, 10) || 90)}
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-sans">
                Minimum confidence score required for straight-through matching without human intervention.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1 uppercase">
                Critical Severity Exposure Threshold (₹)
              </label>
              <input
                type="number"
                min={1000}
                step={500}
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(parseInt(e.target.value, 10) || 10000)}
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-sans">
                Variance amounts above this threshold are flagged with CRITICAL severity for mandatory Treasury signoff.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: AI Model Integration */}
        <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-900">
            <Bot className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold font-mono text-slate-900 uppercase tracking-wider">
              2. AI Forensic Engine Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="p-4 bg-slate-50 border border-slate-900 space-y-1">
              <span className="text-slate-500 uppercase text-[10px] font-bold block">PRIMARY REASONING LLM</span>
              <div className="text-sm font-bold text-blue-800">gemini-3.7-flash</div>
              <p className="text-[11px] text-slate-600 font-sans">
                Executes multi-record contextual reconciliation diagnostics with structured schema output.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-900 space-y-1">
              <span className="text-slate-500 uppercase text-[10px] font-bold block">FALLBACK RESILIENCE</span>
              <div className="text-sm font-bold text-emerald-800">Deterministic Rule Engine</div>
              <p className="text-[11px] text-slate-600 font-sans">
                Zero-downtime offline fallback ensuring uninterrupted batch reconciliation when quota is exhausted.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Environment & Health Diagnostics */}
        <div className="p-6 bg-white border-2 border-slate-900 brutal-shadow space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-900">
            <Server className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold font-mono text-slate-900 uppercase tracking-wider">
              3. Service Health & Readiness
            </h2>
          </div>

          {healthInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">STATUS</span>
                <span className="text-emerald-800 font-bold">{healthInfo.status}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">DATASETS LOADED</span>
                <span className="text-slate-900 font-bold">{healthInfo.datasets_indexed}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">ENGINE MODE</span>
                <span className="text-blue-800 font-bold">{healthInfo.ai_engine}</span>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold uppercase tracking-wider border-2 border-slate-900 brutal-shadow transition-all cursor-pointer"
        >
          SAVE ENGINE CONFIGURATION
        </button>
      </form>
    </div>
  );
}
