import { calculateConfidenceScore, determineSeverity } from '../../server/services/matching.service.js';

export function runMatchingTests() {
  console.log('\n--- Running Unit Tests: Matching Strategies & Confidence Formulas ---');

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

  // 1. Exact Match Test
  const exact = calculateConfidenceScore({
    merchantA: "Amazon Marketplace India",
    merchantB: "Amazon Marketplace India",
    amountA: 2500.00,
    amountB: 2500.00,
    dateA: "2026-08-20",
    dateB: "2026-08-20",
    refA: "REF-001",
    refB: "REF-001"
  });
  assert(exact.confidence >= 0.95, `Exact match confidence must be >= 0.95 (got ${exact.confidence})`);

  // 2. Fuzzy Merchant Match Test
  const fuzzy = calculateConfidenceScore({
    merchantA: "AMZN Mktp IN",
    merchantB: "Amazon Marketplace India",
    amountA: 4500.00,
    amountB: 4500.00,
    dateA: "2026-08-20",
    dateB: "2026-08-20",
    refA: "",
    refB: ""
  });
  assert(fuzzy.confidence >= 0.70, `Fuzzy merchant variation confidence should be >= 0.70 (got ${fuzzy.confidence})`);

  // 3. Amount Mismatch Severity Test
  const sevLow = determineSeverity('AMOUNT_MISMATCH', 50, 4500);
  assert(sevLow === 'LOW', `₹50 diff should be severity LOW (got ${sevLow})`);

  const sevMed = determineSeverity('AMOUNT_MISMATCH', 500, 4500);
  assert(sevMed === 'MEDIUM', `₹500 diff should be severity MEDIUM (got ${sevMed})`);

  const sevHigh = determineSeverity('AMOUNT_MISMATCH', 5000, 45000);
  assert(sevHigh === 'HIGH', `₹5,000 diff should be severity HIGH (got ${sevHigh})`);

  const sevCrit = determineSeverity('AMOUNT_MISMATCH', 50000, 150000);
  assert(sevCrit === 'CRITICAL', `₹50,000 diff should be severity CRITICAL (got ${sevCrit})`);

  return { total, passed, failed: total - passed };
}
