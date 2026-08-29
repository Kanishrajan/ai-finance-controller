import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GitMerge,
  ListOrdered,
  AlertTriangle,
  Wallet,
  Sparkles,
  FileText,
  Database,
  History,
  Settings,
  Play,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Menu,
  X,
  Layers
} from 'lucide-react';
import { reconciliationService } from '../../services/reconciliationService.js';
import { getCurrentUser, setUserRole } from '../../services/api.js';
import confetti from 'canvas-confetti';

export function Navbar({ onRefresh }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNavItems = [
    { num: '01', label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { num: '02', label: 'Reconciliation', path: '/reconciliation', icon: GitMerge },
    { num: '03', label: 'Transactions', path: '/transactions', icon: ListOrdered },
    { num: '04', label: 'Exceptions', path: '/exceptions', icon: AlertTriangle },
    { num: '05', label: 'Cash Position', path: '/cash-position', icon: Wallet },
    { num: '06', label: 'AI Analysis', path: '/ai-analysis', icon: Sparkles },
    { num: '07', label: 'Reports', path: '/reports', icon: FileText },
  ];

  const secondaryNavItems = [
    { label: 'Data Ingestion', path: '/data', icon: Database },
    { label: 'Audit Trail', path: '/audit-log', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleRunDemo = async () => {
    try {
      setIsRunningDemo(true);
      await reconciliationService.runDemo();
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.2 }
        });
      } catch {}

      if (onRefresh) onRefresh();
      navigate('/dashboard');
    } catch (err) {
      console.error('Demo run failed:', err);
    } finally {
      setIsRunningDemo(false);
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset all reconciliation and exception data back to initial baseline?')) {
      await reconciliationService.resetDemo();
      if (onRefresh) onRefresh();
      navigate('/dashboard');
    }
  };

  const handleRoleChange = (role, name) => {
    setUserRole(role, name);
    setCurrentUserState({ role, name });
    setRoleDropdownOpen(false);
    if (onRefresh) onRefresh();
  };

  const roles = [
    { role: 'ADMIN', name: 'Devon Vance (Admin)', desc: 'Full System Control & Configuration' },
    { role: 'FINANCE_CONTROLLER', name: 'Elena Rostova (Controller)', desc: 'Reconciliation & Cash Sign-off' },
    { role: 'ANALYST', name: 'Marcus Chen (Senior Analyst)', desc: 'Matching & Exception Triage' },
    { role: 'VIEWER', name: 'Sarah Jenkins (Auditor)', desc: 'Read-Only Verification' },
  ];

  const isPublicLanding = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-900 no-print">
      {/* Top Ticker / System Status Header */}
      <div className="bg-[#0F172A] text-white px-4 py-1.5 text-xs flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <span className="bg-blue-600 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-none">
              FIN-CONTROL
            </span>
            <span className="font-mono text-[11px] font-semibold tracking-wide text-slate-200">
              AI FINANCE CONTROLLER
            </span>
          </Link>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="font-mono text-[10px] text-slate-400 hidden md:inline">
            ACTIVE BATCH: <strong className="text-slate-200">#FIN-2026-0829</strong>
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="hidden sm:inline font-semibold">ENGINE: NORMALIZED & LIVE</span>
          </div>

          <button
            onClick={handleResetDemo}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset data to initial baseline"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Link */}
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs brutal-shadow-sm">
                FC
              </div>
              <span className="font-display font-bold text-sm tracking-tight text-slate-900 hidden sm:inline">
                CONTROL CENTER
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 brutal-shadow-sm'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border-transparent'
                  }`}
                >
                  <span className={`font-mono text-[10px] ${isActive ? 'text-blue-300' : 'text-slate-400'}`}>
                    {item.num}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs & User Role Persona */}
          <div className="flex items-center gap-2">
            {/* Run Batch Reconciliation Action */}
            <button
              onClick={handleRunDemo}
              disabled={isRunningDemo}
              id="global-run-demo-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-mono uppercase tracking-wider border-2 border-slate-900 brutal-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3 h-3 fill-current ${isRunningDemo ? 'animate-spin' : ''}`} />
              <span>{isRunningDemo ? 'PROCESSING...' : 'RUN BATCH'}</span>
            </button>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-mono font-bold border border-slate-900 transition-colors cursor-pointer"
                title="Switch Active Persona (RBAC)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden sm:inline">{currentUser.role}</span>
                <ChevronDown className="w-3 h-3 text-slate-600" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-slate-900 brutal-shadow-lg p-2 z-50 animate-in fade-in">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    Switch Security Persona (RBAC)
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => handleRoleChange(r.role, r.name)}
                      className={`w-full text-left px-2 py-1.5 text-xs transition-colors flex items-start gap-2 mt-1 border ${
                        currentUser.role === r.role
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'hover:bg-slate-100 text-slate-800 border-transparent'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold">{r.name}</div>
                        <div className={`text-[10px] ${currentUser.role === r.role ? 'text-slate-300' : 'text-slate-500'}`}>
                          {r.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-900 border border-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Secondary Utility Strip */}
        <div className="hidden lg:flex items-center justify-between py-1.5 border-t border-slate-200 text-[11px] font-mono">
          <div className="flex items-center gap-4 text-slate-600">
            {secondaryNavItems.map((sec) => {
              const Icon = sec.icon;
              const isActive = location.pathname === sec.path;
              return (
                <Link
                  key={sec.path}
                  to={sec.path}
                  className={`flex items-center gap-1 hover:text-slate-950 transition-colors ${
                    isActive ? 'font-bold text-slate-950 underline underline-offset-4' : ''
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{sec.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>3-WAY MATCHING RULE ENGINE ACTIVE</span>
            <span>•</span>
            <span>GEMINI SEMANTIC ANALYSIS READY</span>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-900 bg-white space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
              Main Operations
            </div>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider border ${
                    isActive ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-800 hover:bg-slate-100 border-transparent'
                  }`}
                >
                  <span className="font-mono text-[10px] text-blue-500">{item.num}</span>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-2 pt-2 mb-1 border-t border-slate-200">
              System Utilities
            </div>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 font-mono"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
