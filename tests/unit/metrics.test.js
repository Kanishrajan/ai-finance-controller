import { calculateReconciliationMetrics } from '../../server/services/metrics.service.js';

export function runMetricsTests() {
  console.log('\n--- Running Unit Tests: Dynamic Metrics Formulas ---');

  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ ${desc}`);
    } else {
      console.error(`  ✗ ${desc}`);
    }
  }

  const metrics = calculateReconciliationMetrics({
    totalRecords: 100,
    matchedCount: 82,
    probableCount: 12,
    unresolvedCount: 6,
    exceptionCount: 18,
    totalValue: 842500,
    reconciledValue: 791200,
    exceptionValue: 51300,
    processingTimeMs: 1800
  });

  assert(metrics.match_rate === 82.0, `Match rate should be 82.0% (got ${metrics.match_rate}%)`);
  assert(metrics.exception_rate === 18.0, `Exception rate should be 18.0% (got ${metrics.exception_rate}%)`);
  assert(metrics.auto_resolution_rate >= 82.0, `Auto resolution rate should be >= 82.0% (got ${metrics.auto_resolution_rate}%)`);
  assert(metrics.throughput_records_per_sec > 50, `Throughput should be > 50 rec/sec (got ${metrics.throughput_records_per_sec})`);

  return { total, passed, failed: total - passed };
}
