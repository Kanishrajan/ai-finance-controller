import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { Landing } from './pages/Landing.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Data } from './pages/Data.jsx';
import { Reconciliation } from './pages/Reconciliation.jsx';
import { Exceptions } from './pages/Exceptions.jsx';
import { TransactionDetails } from './pages/TransactionDetails.jsx';
import { Reports } from './pages/Reports.jsx';
import { AuditLog } from './pages/AuditLog.jsx';
import { Settings } from './pages/Settings.jsx';
import { ErrorBoundary } from './components/ui/Modal.jsx';

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleGlobalRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route element={<AppLayout onRefresh={handleGlobalRefresh} />}>
            <Route path="/" element={<Landing onRefresh={handleGlobalRefresh} />} />
            <Route path="/dashboard" element={<Dashboard refreshTrigger={refreshTrigger} onRefresh={handleGlobalRefresh} />} />
            <Route path="/data" element={<Data onRefresh={handleGlobalRefresh} />} />
            <Route path="/reconciliation" element={<Reconciliation refreshTrigger={refreshTrigger} />} />
            <Route path="/exceptions" element={<Exceptions refreshTrigger={refreshTrigger} onRefresh={handleGlobalRefresh} />} />
            <Route path="/transactions/:id" element={<TransactionDetails onRefresh={handleGlobalRefresh} />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
