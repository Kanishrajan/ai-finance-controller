import { normalizeMerchant } from './normalization.service.js';
import { calculateMerchantSimilarity, stringRatio } from './similarity.service.js';

export function calculateDateSimilarity(dateStrA, dateStrB) {
  if (!dateStrA || !dateStrB) return 0.5;
  if (dateStrA === dateStrB) return 1.0;

  try {
    const d1 = new Date(dateStrA).getTime();
    const d2 = new Date(dateStrB).getTime();
    const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);

    if (diffDays <= 1) return 0.95;
    if (diffDays <= 3) return 0.75;
    if (diffDays <= 7) return 0.40;
    return 0.10;
  } catch (e) {
    return 0.20;
  }
}

export function calculateAmountSimilarity(amtA, amtB) {
  const a = Number(amtA);
  const b = Number(amtB);
  if (isNaN(a) || isNaN(b)) return 0.0;
  if (Math.abs(a - b) < 0.001) return 1.0;

  const maxVal = Math.max(Math.abs(a), Math.abs(b));
  if (maxVal === 0) return 1.0;

  const diff = Math.abs(a - b);
  const ratio = 1 - diff / maxVal;
  return Math.max(0, Number(ratio.toFixed(3)));
}

export function calculateReferenceSimilarity(refA, refB) {
  if (!refA || !refB) return 0.5; // neutral if missing
  const cleanA = refA.trim().toUpperCase();
  const cleanB = refB.trim().toUpperCase();
  if (cleanA === cleanB) return 1.0;
  return stringRatio(cleanA, cleanB);
}

/**
 * Calculates weighted confidence score based on the Master Spec:
 * Merchant: 40%, Amount: 30%, Date: 20%, Reference: 10%
 */
export function calculateConfidenceScore({
  merchantA,
  merchantB,
  amountA,
  amountB,
  dateA,
  dateB,
  refA,
  refB
}) {
  const normA = normalizeMerchant(merchantA);
  const normB = normalizeMerchant(merchantB);

  const merchantScore = calculateMerchantSimilarity(normA, normB);
  const amountScore = calculateAmountSimilarity(amountA, amountB);
  const dateScore = calculateDateSimilarity(dateA, dateB);
  const referenceScore = calculateReferenceSimilarity(refA, refB);

  const confidence = Number((
    merchantScore * 0.40 +
    amountScore * 0.30 +
    dateScore * 0.20 +
    referenceScore * 0.10
  ).toFixed(3));

  return {
    confidence: Math.min(1.0, Math.max(0.0, confidence)),
    breakdown: {
      merchantScore,
      amountScore,
      dateScore,
      referenceScore
    }
  };
}

/**
 * Determines exception severity based on financial magnitude and discrepancy type
 */
export function determineSeverity(type, amountDifference, totalAmount = 0) {
  if (type === 'DUPLICATE_TRANSACTION') return 'HIGH';
  if (type === 'MISSING_TRANSACTION') {
    return totalAmount > 5000 ? 'CRITICAL' : 'HIGH';
  }
  if (type === 'DATE_MISMATCH') return 'MEDIUM';
  if (type === 'LOW_CONFIDENCE' || type === 'UNRESOLVED') {
    return totalAmount > 20000 ? 'CRITICAL' : 'HIGH';
  }

  // Amount mismatch thresholds
  const diff = Math.abs(amountDifference || 0);
  if (diff >= 10000) return 'CRITICAL';
  if (diff >= 1000) return 'HIGH';
  if (diff >= 100) return 'MEDIUM';
  return 'LOW';
}
