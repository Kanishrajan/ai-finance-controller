import { runNormalizationTests } from './unit/normalization.test.js';
import { runMatchingTests } from './unit/matching.test.js';
import { runMetricsTests } from './unit/metrics.test.js';
import { runIntegrationTests } from './integration/reconciliation.test.js';

async function main() {
  console.log('====================================================');
  console.log(' AI FINANCE CONTROLLER — AUTOMATED TEST SUITE');
  console.log('====================================================');

  const r1 = runNormalizationTests();
  const r2 = runMatchingTests();
  const r3 = runMetricsTests();
  const r4 = await runIntegrationTests();

  const total = r1.total + r2.total + r3.total + r4.total;
  const passed = r1.passed + r2.passed + r3.passed + r4.passed;
  const failed = r1.failed + r2.failed + r3.failed + r4.failed;

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passed}/${total} tests passed (${failed} failed)`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
