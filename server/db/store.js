import crypto from 'crypto';
import { generateSyntheticData } from '../data/syntheticGenerator.js';

class InMemoryDatabase {
  constructor() {
    this.users = new Map();
    this.datasets = new Map();
    this.transactions = new Map();
    this.reconciliations = new Map();
    this.matches = new Map();
    this.exceptions = new Map();
    this.aiAnalyses = new Map();
    this.auditLogs = [];

    // Secondary Indexes for rapid O(1) lookups
    this.transactionsByDataset = new Map();
    this.transactionsByRef = new Map();
    this.transactionsByExternalId = new Map();
    this.matchesByReconciliation = new Map();
    this.exceptionsByReconciliation = new Map();
    this.exceptionsByStatus = new Map();
    this.exceptionsByType = new Map();

    this.initDefaultUsers();
  }

  initDefaultUsers() {
    const demoUsers = [
      { id: 'usr-admin-1', email: 'admin@financecontroller.ai', name: 'Devon Vance (Admin)', role: 'ADMIN' },
      { id: 'usr-controller-1', email: 'controller@financecontroller.ai', name: 'Elena Rostova (Controller)', role: 'FINANCE_CONTROLLER' },
      { id: 'usr-analyst-1', email: 'analyst@financecontroller.ai', name: 'Marcus Chen (Senior Analyst)', role: 'ANALYST' },
      { id: 'usr-viewer-1', email: 'auditor@kpmg-audit.com', name: 'Sarah Jenkins (External Auditor)', role: 'VIEWER' }
    ];

    for (const u of demoUsers) {
      this.users.set(u.id, {
        ...u,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }

  // --- Audit Log Operations ---
  createAuditLog({ userId, userName, entityType, entityId, action, metadata }) {
    const log = {
      id: `aud-${crypto.randomUUID()}`,
      user_id: userId || 'usr-analyst-1',
      user_name: userName || 'Marcus Chen (Senior Analyst)',
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    return log;
  }

  getAuditLogs(limit = 100) {
    return this.auditLogs.slice(0, limit);
  }

  // --- Dataset Operations ---
  createDataset({ name, sourceType, fileName, records = [] }) {
    const datasetId = `ds-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const dataset = {
      id: datasetId,
      name: name || `${sourceType} Dataset`,
      source_type: sourceType,
      file_name: fileName || `${sourceType.toLowerCase()}.csv`,
      record_count: records.length,
      status: 'VALIDATED',
      created_at: now,
      updated_at: now
    };

    this.datasets.set(datasetId, dataset);
    this.transactionsByDataset.set(datasetId, []);

    // Insert Transactions with immutability preservation
    for (const r of records) {
      const txId = `tx-${crypto.randomUUID()}`;
      const txRecord = {
        id: txId,
        dataset_id: datasetId,
        source_type: sourceType,
        external_transaction_id: r.transaction_id || r.external_transaction_id || txId,
        merchant: r.merchant || '',
        normalized_merchant: r.normalized_merchant || r.merchant || '',
        description: r.description || '',
        amount: Number(parseFloat(r.amount || 0).toFixed(2)),
        currency: r.currency || 'INR',
        transaction_date: r.transaction_date || r.date || new Date().toISOString().split('T')[0],
        reference_id: r.reference_id || '',
        created_at: now
      };

      this.transactions.set(txId, txRecord);
      this.transactionsByDataset.get(datasetId).push(txRecord);

      // Add to Ref Index
      if (txRecord.reference_id) {
        if (!this.transactionsByRef.has(txRecord.reference_id)) {
          this.transactionsByRef.set(txRecord.reference_id, []);
        }
        this.transactionsByRef.get(txRecord.reference_id).push(txRecord);
      }

      this.transactionsByExternalId.set(txRecord.external_transaction_id, txRecord);
    }

    this.createAuditLog({
      entityType: 'DATASET',
      entityId: datasetId,
      action: 'DATASET_UPLOADED',
      metadata: { sourceType, recordCount: records.length, fileName }
    });

    return dataset;
  }

  getDataset(id) {
    return this.datasets.get(id) || null;
  }

  getAllDatasets() {
    return Array.from(this.datasets.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getTransactionsByDataset(datasetId) {
    return this.transactionsByDataset.get(datasetId) || [];
  }

  getTransactionById(id) {
    // Check internal ID or external ID
    if (this.transactions.has(id)) return this.transactions.get(id);
    if (this.transactionsByExternalId.has(id)) return this.transactionsByExternalId.get(id);
    return null;
  }

  // --- Reconciliation Operations ---
  createReconciliation(batchId = `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`) {
    const recId = `rec-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const reconciliation = {
      id: recId,
      batch_id: batchId,
      status: 'PROCESSING',
      records_processed: 0,
      matched_count: 0,
      probable_match_count: 0,
      exception_count: 0,
      unresolved_count: 0,
      match_rate: 0,
      auto_resolution_rate: 0,
      total_transaction_value: 0,
      reconciled_value: 0,
      exception_value: 0,
      processing_time_ms: 0,
      started_at: now,
      completed_at: null,
      created_at: now
    };

    this.reconciliations.set(recId, reconciliation);
    this.matchesByReconciliation.set(recId, []);
    this.exceptionsByReconciliation.set(recId, []);

    this.createAuditLog({
      entityType: 'RECONCILIATION',
      entityId: recId,
      action: 'RECONCILIATION_STARTED',
      metadata: { batchId }
    });

    return reconciliation;
  }

  updateReconciliation(id, updates) {
    const rec = this.reconciliations.get(id);
    if (!rec) return null;
    const updated = { ...rec, ...updates, updated_at: new Date().toISOString() };
    this.reconciliations.set(id, updated);
    return updated;
  }

  getReconciliation(id) {
    return this.reconciliations.get(id) || null;
  }

  getAllReconciliations() {
    return Array.from(this.reconciliations.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getLatestReconciliation() {
    const list = this.getAllReconciliations();
    return list.length > 0 ? list[0] : null;
  }

  // --- Match and Exception Storage ---
  saveMatchesAndExceptions(reconciliationId, matches, exceptions, aiAnalyses = []) {
    const recMatches = [];
    const recExceptions = [];

    for (const m of matches) {
      const matchId = m.id || `m-${crypto.randomUUID()}`;
      const matchRecord = {
        ...m,
        id: matchId,
        reconciliation_id: reconciliationId,
        created_at: new Date().toISOString()
      };
      this.matches.set(matchId, matchRecord);
      recMatches.push(matchRecord);
    }
    this.matchesByReconciliation.set(reconciliationId, recMatches);

    for (const ex of exceptions) {
      const exId = ex.id || `ex-${crypto.randomUUID()}`;
      const exRecord = {
        ...ex,
        id: exId,
        reconciliation_id: reconciliationId,
        status: ex.status || 'OPEN',
        created_at: new Date().toISOString(),
        resolved_by: null,
        resolved_at: null,
        resolution_decision: null,
        resolution_note: null
      };
      this.exceptions.set(exId, exRecord);
      recExceptions.push(exRecord);
    }
    this.exceptionsByReconciliation.set(reconciliationId, recExceptions);

    for (const ai of aiAnalyses) {
      const aiId = ai.id || `ai-${crypto.randomUUID()}`;
      this.aiAnalyses.set(aiId, {
        ...ai,
        id: aiId,
        created_at: new Date().toISOString()
      });
    }
  }

  getMatchesByReconciliation(reconciliationId) {
    return this.matchesByReconciliation.get(reconciliationId) || [];
  }

  getExceptionsByReconciliation(reconciliationId) {
    return this.exceptionsByReconciliation.get(reconciliationId) || [];
  }

  getExceptionById(id) {
    return this.exceptions.get(id) || null;
  }

  getMatchById(id) {
    return this.matches.get(id) || null;
  }

  getAIAnalysisByMatchId(matchId) {
    for (const ai of this.aiAnalyses.values()) {
      if (ai.match_id === matchId) return ai;
    }
    return null;
  }

  // --- Exception Resolution with Concurrency & Transactional Guarantee ---
  resolveException(exceptionId, { decision, note, userId, userName }) {
    const exception = this.exceptions.get(exceptionId);
    if (!exception) {
      throw { statusCode: 404, message: 'Exception not found.' };
    }

    // Concurrency check: prevent double resolution
    if (exception.status === 'RESOLVED' || exception.status === 'REJECTED') {
      throw { statusCode: 409, message: 'This exception has already been resolved or rejected.' };
    }

    const now = new Date().toISOString();
    const newStatus = decision === 'REJECT_MATCH' ? 'REJECTED' : 'RESOLVED';

    // Transactional Update
    exception.status = newStatus;
    exception.resolved_by = userName || 'Marcus Chen (Senior Analyst)';
    exception.resolved_at = now;
    exception.resolution_decision = decision;
    exception.resolution_note = note || '';

    // Update related match if exists
    if (exception.match_id && this.matches.has(exception.match_id)) {
      const match = this.matches.get(exception.match_id);
      match.status = newStatus;
      match.explanation = `${match.explanation || ''} | [Review Decision: ${decision} by ${userName || 'Analyst'} on ${now.slice(0, 10)}] Note: ${note || 'None'}`;
    }

    // Update reconciliation summary metrics dynamically
    const rec = this.reconciliations.get(exception.reconciliation_id);
    if (rec) {
      const allExceptions = this.exceptionsByReconciliation.get(exception.reconciliation_id) || [];
      const openCount = allExceptions.filter(e => e.status === 'OPEN').length;
      const resolvedCount = allExceptions.filter(e => e.status === 'RESOLVED').length;
      
      // Auto resolution rate increases when exceptions are reviewed
      const totalResolved = rec.matched_count + resolvedCount;
      rec.auto_resolution_rate = Number(((totalResolved / (rec.records_processed || 1)) * 100).toFixed(1));
      
      // Reconciled value adjusts
      if (newStatus === 'RESOLVED' && exception.amount) {
        rec.reconciled_value = Number((rec.reconciled_value + exception.amount).toFixed(2));
        rec.exception_value = Math.max(0, Number((rec.exception_value - exception.amount).toFixed(2)));
      }
    }

    // Write Audit Log
    this.createAuditLog({
      userId,
      userName,
      entityType: 'EXCEPTION',
      entityId: exceptionId,
      action: decision === 'REJECT_MATCH' ? 'EXCEPTION_REJECTED' : 'EXCEPTION_RESOLVED',
      metadata: {
        transactionId: exception.transaction_id,
        decision,
        note,
        reconciliationId: exception.reconciliation_id,
        previousStatus: 'OPEN',
        newStatus
      }
    });

    return exception;
  }

  addExceptionNote(exceptionId, { note, userName }) {
    const exception = this.exceptions.get(exceptionId);
    if (!exception) {
      throw { statusCode: 404, message: 'Exception not found.' };
    }

    if (!exception.notes) exception.notes = [];
    const noteEntry = {
      id: `note-${crypto.randomUUID()}`,
      text: note,
      author: userName || 'Marcus Chen (Senior Analyst)',
      timestamp: new Date().toISOString()
    };
    exception.notes.push(noteEntry);

    this.createAuditLog({
      entityType: 'EXCEPTION',
      entityId: exceptionId,
      action: 'NOTE_ADDED',
      metadata: { note, transactionId: exception.transaction_id }
    });

    return noteEntry;
  }

  // --- Reset to Demo Base State ---
  resetStore() {
    this.datasets.clear();
    this.transactions.clear();
    this.reconciliations.clear();
    this.matches.clear();
    this.exceptions.clear();
    this.aiAnalyses.clear();
    this.auditLogs = [];

    this.transactionsByDataset.clear();
    this.transactionsByRef.clear();
    this.transactionsByExternalId.clear();
    this.matchesByReconciliation.clear();
    this.exceptionsByReconciliation.clear();
    this.exceptionsByStatus.clear();
    this.exceptionsByType.clear();

    this.initDefaultUsers();
  }
}

// Global Singleton Instance
export const db = new InMemoryDatabase();
