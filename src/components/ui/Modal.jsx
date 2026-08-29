import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px] animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose}></div>
      <div className={`relative w-full ${maxWidth} bg-white border-2 border-slate-900 rounded-none brutal-shadow-lg overflow-hidden z-10 animate-in zoom-in-95`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-900 bg-slate-50">
          <h3 className="text-base font-bold tracking-tight text-slate-900 uppercase font-mono">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-600 hover:text-slate-950 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 bg-white border-2 border-rose-600 brutal-shadow text-center max-w-xl mx-auto">
          <h2 className="text-lg font-bold text-rose-900 uppercase font-mono mb-2">Rendering Exception Interrupted</h2>
          <p className="text-xs text-slate-600 mb-4">A visual component encountered an issue rendering.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider brutal-shadow-sm transition-all cursor-pointer"
          >
            Retry Component
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

