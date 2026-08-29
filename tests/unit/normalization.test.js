import { normalizeMerchant, normalizeDescription } from '../../server/services/normalization.service.js';

export function runNormalizationTests() {
  console.log('\n--- Running Unit Tests: Merchant & Description Normalization ---');

  const cases = [
    { input: "AMZN Mktp IN", expected: "amazon" },
    { input: "Amazon Marketplace India Pvt Ltd", expected: "amazon" },
    { input: "SWIGGY BUNDL TECH BANGALORE", expected: "swiggy" },
    { input: "Bundl Technologies Swiggy", expected: "swiggy" },
    { input: "UBER B.V. AMSTERDAM INT", expected: "uber" },
    { input: "Microsoft Corporation India Ltd.", expected: "microsoft" },
    { input: "MSFT CLOUD AZURE", expected: "microsoft azure" },
    { input: "Google Asia Pacific PTE LTD", expected: "google" }
  ];

  let passed = 0;
  for (const c of cases) {
    const result = normalizeMerchant(c.input);
    const ok = result.includes(c.expected) || c.expected.includes(result);
    if (ok) {
      passed++;
      console.log(`  ✓ Normalized "${c.input}" -> "${result}" (matched "${c.expected}")`);
    } else {
      console.error(`  ✗ Normalization failed for "${c.input}": got "${result}", expected to contain "${c.expected}"`);
    }
  }

  return { total: cases.length, passed, failed: cases.length - passed };
}
