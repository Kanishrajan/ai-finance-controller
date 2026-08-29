// Metrics Calculation Service following Section 47-48 Master Spec

export function calculateReconciliationMetrics({
  totalRecords = 0,
  matchedCount = 0,
  probableCount = 0,
  unresolvedCount = 0,
  exceptionCount = 0,
  totalValue = 0,
  reconciledValue = 0,
  exceptionValue = 0,
  processingTimeMs = 0
}) {
  const safeTotal = Math.max(1, totalRecords);
  const processingSeconds = Math.max(0.01, processingTimeMs / 1000);

  const matchRate = Number(((matchedCount / safeTotal) * 100).toFixed(1));
  const exceptionRate = Number(((exceptionCount / safeTotal) * 100).toFixed(1));
  
  // Auto resolution includes high-confidence matches that didn't need human intervention
  const autoResolutionRate = Number((((matchedCount + (probableCount > 0 ? Math.floor(probableCount * 0.7) : 0)) / safeTotal) * 100).toFixed(1));
  const throughput = Math.round(totalRecords / processingSeconds);

  return {
    records_processed: totalRecords,
    matched_count: matchedCount,
    probable_match_count: probableCount,
    unresolved_count: unresolvedCount,
    exception_count: exceptionCount,
    match_rate: matchRate,
    exception_rate: exceptionRate,
    auto_resolution_rate: Math.min(100, Math.max(0, autoResolutionRate)),
    total_transaction_value: Number(totalValue.toFixed(2)),
    reconciled_value: Number(reconciledValue.toFixed(2)),
    exception_value: Number(exceptionValue.toFixed(2)),
    processing_time_ms: processingTimeMs,
    throughput_records_per_sec: throughput
  };
}
