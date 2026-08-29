import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSyntheticData, convertToCsv } from './syntheticGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function seedStaticCsvFiles() {
  const { bankRecords, gatewayRecords, ledgerRecords } = generateSyntheticData();
  const rootDataDir = path.resolve(__dirname, '../../data');
  const serverDataDir = path.resolve(__dirname);

  if (!fs.existsSync(rootDataDir)) {
    fs.mkdirSync(rootDataDir, { recursive: true });
  }

  const bankCsv = convertToCsv(bankRecords);
  const gatewayCsv = convertToCsv(gatewayRecords);
  const ledgerCsv = convertToCsv(ledgerRecords);

  fs.writeFileSync(path.join(rootDataDir, 'bank.csv'), bankCsv, 'utf8');
  fs.writeFileSync(path.join(rootDataDir, 'gateway.csv'), gatewayCsv, 'utf8');
  fs.writeFileSync(path.join(rootDataDir, 'ledger.csv'), ledgerCsv, 'utf8');

  fs.writeFileSync(path.join(serverDataDir, 'bank.csv'), bankCsv, 'utf8');
  fs.writeFileSync(path.join(serverDataDir, 'gateway.csv'), gatewayCsv, 'utf8');
  fs.writeFileSync(path.join(serverDataDir, 'ledger.csv'), ledgerCsv, 'utf8');

  console.log(`[Seed] Successfully generated synthetic datasets:`);
  console.log(` - Bank transactions: ${bankRecords.length}`);
  console.log(` - Gateway transactions: ${gatewayRecords.length}`);
  console.log(` - Ledger transactions: ${ledgerRecords.length}`);

  return { bankRecords, gatewayRecords, ledgerRecords };
}

// Run immediately if called directly
if (process.argv[1] === __filename) {
  seedStaticCsvFiles();
}
