import { db } from '../db/store.js';

export function getReportByReconciliationId(req, res) {
  const { id } = req.params;
  const rec = id === 'latest' ? db.getLatestReconciliation() : db.getReconciliation(id);

  if (!rec) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Reconciliation report not found.' }
    });
  }

  const matches = db.getMatchesByReconciliation(rec.id);
  const exceptions = db.getExceptionsByReconciliation(rec.id);

  const breakdownByType = {
    AMOUNT_MISMATCH: exceptions.filter(e => e.type === 'AMOUNT_MISMATCH').length,
    MISSING_TRANSACTION: exceptions.filter(e => e.type === 'MISSING_TRANSACTION').length,
    DUPLICATE_TRANSACTION: exceptions.filter(e => e.type === 'DUPLICATE_TRANSACTION').length,
    DATE_MISMATCH: exceptions.filter(e => e.type === 'DATE_MISMATCH').length,
    LOW_CONFIDENCE: exceptions.filter(e => e.type === 'LOW_CONFIDENCE' || e.type === 'UNRESOLVED').length
  };

  const confidenceDistribution = {
    high: matches.filter(m => m.confidence >= 0.90).length,
    medium: matches.filter(m => m.confidence >= 0.70 && m.confidence < 0.90).length,
    low: matches.filter(m => m.confidence < 0.70).length
  };

  res.json({
    success: true,
    data: {
      report_title: 'AI FINANCE CONTROLLER — EXECUTIVE RECONCILIATION AUDIT REPORT',
      batch_id: rec.batch_id,
      reconciliation_id: rec.id,
      generated_at: new Date().toISOString(),
      summary: {
        records_processed: rec.records_processed,
        matched_count: rec.matched_count,
        probable_match_count: rec.probable_match_count,
        unresolved_count: rec.unresolved_count,
        exception_count: rec.exception_count,
        resolved_exceptions: exceptions.filter(e => e.status === 'RESOLVED').length,
        open_exceptions: exceptions.filter(e => e.status === 'OPEN').length,
        rejected_exceptions: exceptions.filter(e => e.status === 'REJECTED').length,
        match_rate: `${rec.match_rate}%`,
        auto_resolution_rate: `${rec.auto_resolution_rate}%`,
        total_transaction_value: rec.total_transaction_value,
        reconciled_value: rec.reconciled_value,
        exception_value: rec.exception_value,
        processing_time_ms: rec.processing_time_ms,
        throughput_records_sec: Math.round(rec.records_processed / (Math.max(1, rec.processing_time_ms) / 1000))
      },
      exception_breakdown: breakdownByType,
      confidence_distribution: confidenceDistribution,
      audit_certified_by: 'Automated AI Controller & Dual Oversight Protocol'
    }
  });
}

export function downloadReportCsv(req, res) {
  const { id } = req.params;
  const rec = id === 'latest' ? db.getLatestReconciliation() : db.getReconciliation(id);

  if (!rec) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Reconciliation batch not found.' }
    });
  }

  const matches = db.getMatchesByReconciliation(rec.id);

  const headers = [
    'transaction_id',
    'bank_id',
    'gateway_id',
    'ledger_id',
    'merchant',
    'amount',
    'currency',
    'transaction_date',
    'reference_id',
    'classification',
    'confidence',
    'matching_method',
    'amount_difference',
    'status'
  ];

  const rows = matches.map(m => {
    const txId = m.bankTx?.external_transaction_id || m.gatewayTx?.external_transaction_id || m.id;
    const bankId = m.bankTx?.external_transaction_id || 'N/A';
    const gwId = m.gatewayTx?.external_transaction_id || 'N/A';
    const ledId = m.ledgerTx?.external_transaction_id || 'N/A';
    const merchant = m.bankTx?.merchant || m.gatewayTx?.merchant || m.ledgerTx?.merchant || 'N/A';
    const amt = m.bankTx?.amount || m.gatewayTx?.amount || 0;
    const curr = m.bankTx?.currency || 'INR';
    const date = m.bankTx?.transaction_date || m.gatewayTx?.transaction_date || 'N/A';
    const ref = m.bankTx?.reference_id || m.gatewayTx?.reference_id || 'N/A';
    const classification = m.classification;
    const conf = `${Math.round(m.confidence * 100)}%`;
    const method = m.matching_method;
    const diff = m.amount_difference || 0;
    const status = m.status;

    return [
      `"${txId}"`,
      `"${bankId}"`,
      `"${gwId}"`,
      `"${ledId}"`,
      `"${merchant.replace(/"/g, '""')}"`,
      amt.toFixed(2),
      `"${curr}"`,
      `"${date}"`,
      `"${ref.replace(/"/g, '""')}"`,
      `"${classification}"`,
      `"${conf}"`,
      `"${method}"`,
      diff.toFixed(2),
      `"${status}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="reconciliation_report_${rec.batch_id}.csv"`);
  res.send(csvContent);
}
