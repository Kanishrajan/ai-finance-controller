import { Router } from 'express';
import { uploadDataset, getAllDatasets, getDatasetById } from '../controllers/dataset.controller.js';
import {
  createReconciliation,
  getAllReconciliations,
  getReconciliationById,
  getReconciliationMetrics,
  runDemo,
  resetDemo
} from '../controllers/reconciliation.controller.js';
import { getAllTransactions, getTransactionDetails } from '../controllers/transaction.controller.js';
import {
  getAllExceptions,
  getExceptionById,
  resolveException,
  rejectException,
  addExceptionNote
} from '../controllers/exception.controller.js';
import { getReportByReconciliationId, downloadReportCsv } from '../controllers/report.controller.js';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { getHealth, getReadiness } from '../controllers/health.controller.js';
import { authenticateUser, requireRole } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/common.middleware.js';

const router = Router();

// Apply Auth & Common Middleware
router.use(authenticateUser);

// --- Health Endpoints ---
router.get('/health', getHealth);
router.get('/ready', getReadiness);

// --- Demo Endpoints ---
router.post('/demo/run', runDemo);
router.post('/demo/reset', resetDemo);

// --- Datasets Endpoints ---
router.post('/datasets/upload', rateLimiter({ maxRequests: 50 }), requireRole('ADMIN', 'FINANCE_CONTROLLER', 'ANALYST'), uploadDataset);
router.get('/datasets', getAllDatasets);
router.get('/datasets/:id', getDatasetById);

// --- Reconciliation Endpoints ---
router.post('/reconciliations', rateLimiter({ maxRequests: 30 }), requireRole('ADMIN', 'FINANCE_CONTROLLER', 'ANALYST'), createReconciliation);
router.get('/reconciliations', getAllReconciliations);
router.get('/reconciliations/:id', getReconciliationById);
router.get('/reconciliations/:id/metrics', getReconciliationMetrics);

// --- Transactions Endpoints ---
router.get('/transactions', getAllTransactions);
router.get('/transactions/:id', getTransactionDetails);

// --- Exceptions Endpoints ---
router.get('/exceptions', getAllExceptions);
router.get('/exceptions/:id', getExceptionById);
router.post('/exceptions/:id/resolve', requireRole('ADMIN', 'FINANCE_CONTROLLER', 'ANALYST'), resolveException);
router.post('/exceptions/:id/reject', requireRole('ADMIN', 'FINANCE_CONTROLLER', 'ANALYST'), rejectException);
router.post('/exceptions/:id/notes', addExceptionNote);

// --- Reports Endpoints ---
router.get('/reports/:id', getReportByReconciliationId);
router.get('/reports/:id/csv', downloadReportCsv);

// --- Audit Logs Endpoint ---
router.get('/audit-logs', getAuditLogs);

export default router;
