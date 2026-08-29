import { db } from '../../server/db/store.js';
import { generateSyntheticData } from '../../server/data/syntheticGenerator.js';
import { runReconciliationBatch } from '../../server/services/reconciliation.service.js';

export async function runIntegrationTests() {
  console.log('\n--- Running Integration Test: Full Reconciliation Pipeline & Exceptions ---');

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

  db.resetStore();

  const { bankRecords, gatewayRecords, ledgerRecords } = generateSyntheticData();
  const bankDs = db.createDataset({ name: 'Bank Test', sourceType: 'BANK', records: bankRecords });
  const gwDs = db.createDataset({ name: 'Gateway Test', sourceType: 'PAYMENT_GATEWAY', records: gatewayRecords });
  const ledDs = db.createDataset({ name: 'Ledger Test', sourceType: 'INTERNAL_LEDGER', records: ledgerRecords });

  assert(bankDs.record_count > 100, `Bank dataset ingested ${bankDs.record_count} records (> 100)`);
  assert(gwDs.record_count > 100, `Gateway dataset ingested ${gwDs.record_count} records (> 100)`);

  const result = await runReconciliationBatch({
    bankDatasetId: bankDs.id,
    gatewayDatasetId: gwDs.id,
    ledgerDatasetId: ledDs.id,
    batchId: 'TEST-BATCH-001'
  });

  assert(result.reconciliation.status === 'COMPLETED', `Batch status should be COMPLETED (got ${result.reconciliation.status})`);
  assert(result.matches.length > 90, `Matches count should be > 90 (got ${result.matches.length})`);
  assert(result.exceptions.length > 0, `Detected exceptions should be > 0 (got ${result.exceptions.length})`);
  assert(result.metrics.match_rate > 50, `Match rate should be > 50% (got ${result.metrics.match_rate}%)`);
  assert(result.metrics.total_transaction_value > 0, `Total transaction value should be > 0 (got ₹${result.metrics.total_transaction_value})`);

  // Test Exception Resolution with Audit Trail
  const testException = result.exceptions[0];
  const resolved = db.resolveException(testException.id, {
    decision: 'ACCEPT_MATCH',
    note: 'Verified against settlement statement',
    userId: 'usr-analyst-1',
    userName: 'Marcus Chen'
  });

  assert(resolved.status === 'RESOLVED', `Exception status changed to RESOLVED (got ${resolved.status})`);
  assert(resolved.resolution_decision === 'ACCEPT_MATCH', `Resolution decision stored as ACCEPT_MATCH`);

  const auditLogs = db.getAuditLogs();
  assert(auditLogs.length > 0, `Audit logs captured actions (got ${auditLogs.length} logs)`);
  assert(auditLogs[0].action === 'EXCEPTION_RESOLVED', `Latest audit action is EXCEPTION_RESOLVED`);

  return { total, passed, failed: total - passed };
}
