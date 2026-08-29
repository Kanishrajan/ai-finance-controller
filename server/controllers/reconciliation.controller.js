import { db } from '../db/store.js';
import { runReconciliationBatch } from '../services/reconciliation.service.js';
import { generateSyntheticData } from '../data/syntheticGenerator.js';

export async function createReconciliation(req, res, next) {
  try {
    let { bank_dataset_id, gateway_dataset_id, ledger_dataset_id, batch_id } = req.body;

    // If IDs are not supplied, find latest datasets of each type or create demo ones
    if (!bank_dataset_id || !gateway_dataset_id || !ledger_dataset_id) {
      const allDs = db.getAllDatasets();
      const bankDs = allDs.find(d => d.source_type === 'BANK');
      const gwDs = allDs.find(d => d.source_type === 'PAYMENT_GATEWAY');
      const ledDs = allDs.find(d => d.source_type === 'INTERNAL_LEDGER');

      if (bankDs && gwDs && ledDs) {
        bank_dataset_id = bankDs.id;
        gateway_dataset_id = gwDs.id;
        ledger_dataset_id = ledDs.id;
      } else {
        // Automatically seed synthetic datasets
        const { bankRecords, gatewayRecords, ledgerRecords } = generateSyntheticData();
        const b = db.createDataset({ name: 'HDFC Corporate Bank Statement', sourceType: 'BANK', fileName: 'bank_statement.csv', records: bankRecords });
        const g = db.createDataset({ name: 'Razorpay / Stripe Gateway Auth Log', sourceType: 'PAYMENT_GATEWAY', fileName: 'gateway_auth.csv', records: gatewayRecords });
        const l = db.createDataset({ name: 'SAP Oracle General Ledger Journal', sourceType: 'INTERNAL_LEDGER', fileName: 'general_ledger.csv', records: ledgerRecords });
        bank_dataset_id = b.id;
        gateway_dataset_id = g.id;
        ledger_dataset_id = l.id;
      }
    }

    const batch = batch_id || `BATCH-2026-08-${Date.now().toString().slice(-4)}`;
    const result = await runReconciliationBatch({
      bankDatasetId: bank_dataset_id,
      gatewayDatasetId: gateway_dataset_id,
      ledgerDatasetId: ledger_dataset_id,
      batchId: batch
    });

    return res.status(201).json({
      success: true,
      data: {
        reconciliation_id: result.reconciliation.id,
        batch_id: result.reconciliation.batch_id,
        status: result.reconciliation.status,
        metrics: result.metrics
      }
    });
  } catch (err) {
    next(err);
  }
}

export function getAllReconciliations(req, res) {
  const list = db.getAllReconciliations();
  res.json({
    success: true,
    data: list
  });
}

export function getReconciliationById(req, res) {
  const rec = db.getReconciliation(req.params.id);
  if (!rec) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Reconciliation batch not found.' }
    });
  }

  const matches = db.getMatchesByReconciliation(rec.id);
  const exceptions = db.getExceptionsByReconciliation(rec.id);

  res.json({
    success: true,
    data: {
      reconciliation: rec,
      metrics: {
        records_processed: rec.records_processed,
        matched_count: rec.matched_count,
        probable_match_count: rec.probable_match_count,
        unresolved_count: rec.unresolved_count,
        exception_count: rec.exception_count,
        match_rate: rec.match_rate,
        auto_resolution_rate: rec.auto_resolution_rate,
        total_transaction_value: rec.total_transaction_value,
        reconciled_value: rec.reconciled_value,
        exception_value: rec.exception_value,
        processing_time_ms: rec.processing_time_ms
      },
      matches_summary: {
        total: matches.length,
        items: matches.slice(0, 150)
      },
      exceptions_summary: {
        total: exceptions.length,
        open: exceptions.filter(e => e.status === 'OPEN').length,
        resolved: exceptions.filter(e => e.status === 'RESOLVED').length,
        rejected: exceptions.filter(e => e.status === 'REJECTED').length
      }
    }
  });
}

export function getReconciliationMetrics(req, res) {
  const rec = req.params.id === 'latest' ? db.getLatestReconciliation() : db.getReconciliation(req.params.id);
  if (!rec) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Reconciliation record not found.' }
    });
  }

  res.json({
    success: true,
    data: {
      batch_id: rec.batch_id,
      records_processed: rec.records_processed,
      matched_count: rec.matched_count,
      probable_match_count: rec.probable_match_count,
      unresolved_count: rec.unresolved_count,
      exception_count: rec.exception_count,
      match_rate: rec.match_rate,
      auto_resolution_rate: rec.auto_resolution_rate,
      total_transaction_value: rec.total_transaction_value,
      reconciled_value: rec.reconciled_value,
      exception_value: rec.exception_value,
      processing_time_ms: rec.processing_time_ms,
      throughput: Math.round(rec.records_processed / (Math.max(1, rec.processing_time_ms) / 1000))
    }
  });
}

/**
 * 1-Click Demo Runner endpoint: automatically loads 100+ synthetic records, runs reconciliation, and outputs full results
 */
export async function runDemo(req, res, next) {
  try {
    const { bankRecords, gatewayRecords, ledgerRecords } = generateSyntheticData();
    const batchId = `DEMO-2026-AUG-${Date.now().toString().slice(-4)}`;

    const bankDs = db.createDataset({
      name: 'Bank Feeds (HDFC Corporate A/C)',
      sourceType: 'BANK',
      fileName: 'bank_statement_aug2026.csv',
      records: bankRecords
    });

    const gwDs = db.createDataset({
      name: 'Payment Gateway (Stripe & Razorpay)',
      sourceType: 'PAYMENT_GATEWAY',
      fileName: 'pg_settlement_aug2026.csv',
      records: gatewayRecords
    });

    const ledDs = db.createDataset({
      name: 'Internal ERP Ledger (SAP S/4HANA)',
      sourceType: 'INTERNAL_LEDGER',
      fileName: 'sap_gl_entries_aug2026.csv',
      records: ledgerRecords
    });

    const result = await runReconciliationBatch({
      bankDatasetId: bankDs.id,
      gatewayDatasetId: gwDs.id,
      ledgerDatasetId: ledDs.id,
      batchId
    });

    res.json({
      success: true,
      message: 'Demo dataset processed and reconciled successfully.',
      data: {
        batch_id: batchId,
        reconciliation_id: result.reconciliation.id,
        metrics: result.metrics,
        exceptions_count: result.exceptions.length
      }
    });
  } catch (err) {
    next(err);
  }
}

export function resetDemo(req, res) {
  db.resetStore();
  res.json({
    success: true,
    message: 'Demo store reset to fresh baseline.'
  });
}
