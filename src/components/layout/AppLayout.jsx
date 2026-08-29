import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';

export function AppLayout({ onRefresh }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] flex flex-col selection:bg-slate-900 selection:text-white bg-grid-pattern">
      <Navbar onRefresh={onRefresh} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t-2 border-slate-900 bg-white py-6 text-xs text-slate-600 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 uppercase">AI FINANCE CONTROLLER</span>
            <span className="text-slate-400">•</span>
            <span>Batch Reconciliation & Cash Position Control</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
            <span>DETERMINISTIC RULE ENGINE</span>
            <span>•</span>
            <span>GEMINI DIAGNOSTICS</span>
            <span>•</span>
            <span>SHA-256 AUDIT LOG</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
