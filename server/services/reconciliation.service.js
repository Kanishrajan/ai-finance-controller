import crypto from 'crypto';
import { db } from '../db/store.js';
import { normalizeMerchant } from './normalization.service.js';
import { calculateConfidenceScore, determineSeverity, calculateDateSimilarity } from './matching.service.js';
import { analyzeWithAI } from './ai.service.js';
import { calculateReconciliationMetrics } from './metrics.service.js';

export async function runReconciliationBatch({ bankDatasetId, gatewayDatasetId, ledgerDatasetId, batchId }) {
  const startTime = Date.now();
  const reconciliation = db.createReconciliation(batchId);
  const recId = reconciliation.id;

  // 1. Load transactions from the three datasets
  const bankList = db.getTransactionsByDataset(bankDatasetId);
  const gatewayList = db.getTransactionsByDataset(gatewayDatasetId);
  const ledgerList = db.getTransactionsByDataset(ledgerDatasetId);

  const matchedGroups = [];
  const exceptionsList = [];
  const aiAnalysesList = [];

  const matchedBankIds = new Set();
  const matchedGatewayIds = new Set();
  const matchedLedgerIds = new Set();

  let totalValue = 0;
  let reconciledValue = 0;
  let exceptionValue = 0;

  // Compute total portfolio value
  for (const b of bankList) {
    totalValue += b.amount;
  }

  // Index Gateway and Ledger records by reference_id for Strategy 1
  const gwByRef = new Map();
  for (const gw of gatewayList) {
    if (gw.reference_id && gw.reference_id.trim()) {
      if (!gwByRef.has(gw.reference_id.trim())) gwByRef.set(gw.reference_id.trim(), []);
      gwByRef.get(gw.reference_id.trim()).push(gw);
    }
  }

  const ledByRef = new Map();
  for (const led of ledgerList) {
    if (led.reference_id && led.reference_id.trim()) {
      if (!ledByRef.has(led.reference_id.trim())) ledByRef.set(led.reference_id.trim(), []);
      ledByRef.get(led.reference_id.trim()).push(led);
    }
  }

  // Strategy 1 & 5: Match by Reference ID (Checks exact, amount mismatch, duplicate, date delay)
  for (const bankTx of bankList) {
    const ref = bankTx.reference_id ? bankTx.reference_id.trim() : null;
    if (!ref) continue;

    const gwCandidates = gwByRef.get(ref) || [];
    const ledCandidates = ledByRef.get(ref) || [];

    if (gwCandidates.length > 0 && ledCandidates.length > 0) {
      const gwTx = gwCandidates[0];
      const ledTx = ledCandidates[0];

      matchedBankIds.add(bankTx.id);
      matchedGatewayIds.add(gwTx.id);
      matchedLedgerIds.add(ledTx.id);

      const amountDiff = Number((bankTx.amount - gwTx.amount).toFixed(2));
      const hasDuplicateGw = gwCandidates.length > 1;

      const { confidence, breakdown } = calculateConfidenceScore({
        merchantA: bankTx.merchant,
        merchantB: gwTx.merchant,
        amountA: bankTx.amount,
        amountB: gwTx.amount,
        dateA: bankTx.transaction_date,
        dateB: gwTx.transaction_date,
        refA: bankTx.reference_id,
        refB: gwTx.reference_id
      });

      const dateSim = calculateDateSimilarity(bankTx.transaction_date, gwTx.transaction_date);

      let classification = 'MATCHED';
      let matchingMethod = 'EXACT_REFERENCE';
      let status = 'RESOLVED';
      let explanation = `Reconciled via 3-way reference linkage (${ref}).`;

      // Exception Check 1: Duplicate Gateway transactions
      if (hasDuplicateGw) {
        classification = 'DUPLICATE_TRANSACTION';
        matchingMethod = 'DUPLICATE_AUTH_DETECTION';
        status = 'REVIEW_REQUIRED';
        explanation = `Multiple payment gateway authorization entries detected for reference ${ref}.`;
      }
      // Exception Check 2: Amount Mismatch
      else if (Math.abs(amountDiff) > 0.01) {
        classification = 'AMOUNT_MISMATCH';
        matchingMethod = 'AMOUNT_VARIANCE_ANALYSIS';
        status = 'REVIEW_REQUIRED';
        explanation = `Reference matched, but gateway amount differs by ₹${Math.abs(amountDiff).toFixed(2)} from bank/ledger.`;
      }
      // Exception Check 3: Date Delay (> 3 days)
      else if (dateSim < 0.7) {
        classification = 'DATE_MISMATCH';
        matchingMethod = 'DATE_CLEARING_LAG';
        status = 'REVIEW_REQUIRED';
        explanation = `Transaction posting date in bank (${bankTx.transaction_date}) is significantly delayed compared to gateway authorization (${gwTx.transaction_date}).`;
      }

      const matchId = `match-${crypto.randomUUID()}`;

      // AI Analysis for ambiguous or exception cases
      let aiResult = null;
      if (classification !== 'MATCHED') {
        aiResult = await analyzeWithAI({
          bankTx,
          gatewayTx: gwTx,
          ledgerTx: ledTx,
          matchingMethod,
          confidence,
          amountDiff,
          classification
        });

        aiAnalysesList.push({
          match_id: matchId,
          ...aiResult
        });
      }

      const matchObj = {
        id: matchId,
        transaction_a_id: bankTx.id,
        transaction_b_id: gwTx.id,
        transaction_c_id: ledTx.id,
        bankTx,
        gatewayTx: gwTx,
        ledgerTx: ledTx,
        confidence: aiResult ? aiResult.confidence : confidence,
        classification,
        matching_method: matchingMethod,
        amount_difference: amountDiff,
        explanation: aiResult ? `${explanation} [AI: ${aiResult.reason}]` : explanation,
        status: status === 'RESOLVED' ? 'AUTO_MATCHED' : 'OPEN'
      };
      matchedGroups.push(matchObj);

      if (classification === 'MATCHED') {
        reconciledValue += bankTx.amount;
      } else {
        exceptionValue += bankTx.amount;
        const exId = `ex-${crypto.randomUUID()}`;
        const severity = determineSeverity(classification, amountDiff, bankTx.amount);

        exceptionsList.push({
          id: exId,
          match_id: matchId,
          transaction_id: bankTx.external_transaction_id,
          type: classification,
          severity,
          confidence: aiResult ? aiResult.confidence : confidence,
          amount: bankTx.amount,
          difference: amountDiff,
          description: explanation,
          recommendation: aiResult ? aiResult.recommendation : 'MANUAL_REVIEW',
          status: 'OPEN',
          bankTx,
          gatewayTx: gwTx,
          ledgerTx: ledTx,
          ai_analysis: aiResult
        });
      }
    }
  }

  // Strategy 2 & 3: Match remaining unlinked records by Amount + Date + Fuzzy Merchant
  const remainingBank = bankList.filter(b => !matchedBankIds.has(b.id));
  const remainingGw = gatewayList.filter(g => !matchedGatewayIds.has(g.id));
  const remainingLed = ledgerList.filter(l => !matchedLedgerIds.has(l.id));

  for (const bankTx of remainingBank) {
    let bestGw = null;
    let bestGwScore = 0;

    for (const gwTx of remainingGw) {
      if (matchedGatewayIds.has(gwTx.id)) continue;
      const { confidence } = calculateConfidenceScore({
        merchantA: bankTx.merchant,
        merchantB: gwTx.merchant,
        amountA: bankTx.amount,
        amountB: gwTx.amount,
        dateA: bankTx.transaction_date,
        dateB: gwTx.transaction_date,
        refA: bankTx.reference_id,
        refB: gwTx.reference_id
      });

      if (confidence > bestGwScore) {
        bestGwScore = confidence;
        bestGw = gwTx;
      }
    }

    let bestLed = null;
    let bestLedScore = 0;
    for (const ledTx of remainingLed) {
      if (matchedLedgerIds.has(ledTx.id)) continue;
      const { confidence } = calculateConfidenceScore({
        merchantA: bankTx.merchant,
        merchantB: ledTx.merchant,
        amountA: bankTx.amount,
        amountB: ledTx.amount,
        dateA: bankTx.transaction_date,
        dateB: ledTx.transaction_date,
        refA: bankTx.reference_id,
        refB: ledTx.reference_id
      });
      if (confidence > bestLedScore) {
        bestLedScore = confidence;
        bestLed = ledTx;
      }
    }

    if (bestGw && bestGwScore >= 0.70 && bestLed && bestLedScore >= 0.70) {
      matchedBankIds.add(bankTx.id);
      matchedGatewayIds.add(bestGw.id);
      matchedLedgerIds.add(bestLed.id);

      const avgConfidence = Number(((bestGwScore + bestLedScore) / 2).toFixed(2));
      const amountDiff = Number((bankTx.amount - bestGw.amount).toFixed(2));
      const isHighConfidence = avgConfidence >= 0.90 && Math.abs(amountDiff) < 0.01;

      const classification = isHighConfidence ? 'MATCHED' : (avgConfidence >= 0.70 ? 'PROBABLE_MATCH' : 'UNRESOLVED');
      const matchingMethod = 'FUZZY_MERCHANT';
      const matchId = `match-${crypto.randomUUID()}`;

      const aiResult = await analyzeWithAI({
        bankTx,
        gatewayTx: bestGw,
        ledgerTx: bestLed,
        matchingMethod,
        confidence: avgConfidence,
        amountDiff,
        classification
      });

      aiAnalysesList.push({
        match_id: matchId,
        ...aiResult
      });

      const matchObj = {
        id: matchId,
        transaction_a_id: bankTx.id,
        transaction_b_id: bestGw.id,
        transaction_c_id: bestLed.id,
        bankTx,
        gatewayTx: bestGw,
        ledgerTx: bestLed,
        confidence: aiResult.confidence,
        classification: aiResult.classification || classification,
        matching_method: matchingMethod,
        amount_difference: amountDiff,
        explanation: `Fuzzy matched without reference ID. Merchant similarity verified. [AI: ${aiResult.reason}]`,
        status: isHighConfidence ? 'AUTO_MATCHED' : 'OPEN'
      };
      matchedGroups.push(matchObj);

      if (isHighConfidence) {
        reconciledValue += bankTx.amount;
      } else {
        exceptionValue += bankTx.amount;
        const exId = `ex-${crypto.randomUUID()}`;
        exceptionsList.push({
          id: exId,
          match_id: matchId,
          transaction_id: bankTx.external_transaction_id,
          type: classification,
          severity: determineSeverity(classification, amountDiff, bankTx.amount),
          confidence: aiResult.confidence,
          amount: bankTx.amount,
          difference: amountDiff,
          description: `Probable match detected based on merchant token overlap and amount.`,
          recommendation: aiResult.recommendation,
          status: 'OPEN',
          bankTx,
          gatewayTx: bestGw,
          ledgerTx: bestLed,
          ai_analysis: aiResult
        });
      }
    }
  }

  // Strategy 4 & Missing Transactions: Capture unpaired Bank or Gateway transactions
  const unmatchedBank = bankList.filter(b => !matchedBankIds.has(b.id));
  const unmatchedGw = gatewayList.filter(g => !matchedGatewayIds.has(g.id));

  for (const b of unmatchedBank) {
    const matchId = `match-${crypto.randomUUID()}`;
    const exId = `ex-${crypto.randomUUID()}`;
    exceptionValue += b.amount;

    const aiResult = await analyzeWithAI({
      bankTx: b,
      gatewayTx: null,
      ledgerTx: null,
      matchingMethod: 'MISSING_GATEWAY_RECORD',
      confidence: 0.20,
      amountDiff: b.amount,
      classification: 'MISSING_TRANSACTION'
    });

    aiAnalysesList.push({
      match_id: matchId,
      ...aiResult
    });

    matchedGroups.push({
      id: matchId,
      transaction_a_id: b.id,
      transaction_b_id: null,
      transaction_c_id: null,
      bankTx: b,
      gatewayTx: null,
      ledgerTx: null,
      confidence: 0.20,
      classification: 'MISSING_TRANSACTION',
      matching_method: 'MISSING_RECORD_IDENTIFIER',
      amount_difference: b.amount,
      explanation: `Transaction present in Bank statement but missing in Gateway authorizations.`,
      status: 'OPEN'
    });

    exceptionsList.push({
      id: exId,
      match_id: matchId,
      transaction_id: b.external_transaction_id,
      type: 'MISSING_TRANSACTION',
      severity: determineSeverity('MISSING_TRANSACTION', b.amount, b.amount),
      confidence: 0.20,
      amount: b.amount,
      difference: b.amount,
      description: `Unlinked bank transaction. No matching gateway authorization found.`,
      recommendation: aiResult.recommendation,
      status: 'OPEN',
      bankTx: b,
      gatewayTx: null,
      ledgerTx: null,
      ai_analysis: aiResult
    });
  }

  for (const g of unmatchedGw) {
    const matchId = `match-${crypto.randomUUID()}`;
    const exId = `ex-${crypto.randomUUID()}`;
    exceptionValue += g.amount;

    const aiResult = await analyzeWithAI({
      bankTx: null,
      gatewayTx: g,
      ledgerTx: null,
      matchingMethod: 'UNSETTLED_GATEWAY_RECORD',
      confidence: 0.20,
      amountDiff: g.amount,
      classification: 'MISSING_TRANSACTION'
    });

    aiAnalysesList.push({
      match_id: matchId,
      ...aiResult
    });

    matchedGroups.push({
      id: matchId,
      transaction_a_id: null,
      transaction_b_id: g.id,
      transaction_c_id: null,
      bankTx: null,
      gatewayTx: g,
      ledgerTx: null,
      confidence: 0.20,
      classification: 'MISSING_TRANSACTION',
      matching_method: 'UNSETTLED_GATEWAY_RECORD',
      amount_difference: g.amount,
      explanation: `Authorized in payment gateway but not yet settled to Bank statement.`,
      status: 'OPEN'
    });

    exceptionsList.push({
      id: exId,
      match_id: matchId,
      transaction_id: g.external_transaction_id,
      type: 'MISSING_TRANSACTION',
      severity: determineSeverity('MISSING_TRANSACTION', g.amount, g.amount),
      confidence: 0.20,
      amount: g.amount,
      difference: g.amount,
      description: `Unsettled gateway authorization without corresponding bank deposit.`,
      recommendation: aiResult.recommendation,
      status: 'OPEN',
      bankTx: null,
      gatewayTx: g,
      ledgerTx: null,
      ai_analysis: aiResult
    });
  }

  const processingTimeMs = Date.now() - startTime;

  // Calculate Metrics dynamically
  const matchedCount = matchedGroups.filter(m => m.classification === 'MATCHED').length;
  const probableCount = matchedGroups.filter(m => m.classification === 'PROBABLE_MATCH').length;
  const unresolvedCount = matchedGroups.filter(m => m.classification === 'UNRESOLVED').length;
  const exceptionCount = exceptionsList.length;

  const metrics = calculateReconciliationMetrics({
    totalRecords: matchedGroups.length,
    matchedCount,
    probableCount,
    unresolvedCount,
    exceptionCount,
    totalValue,
    reconciledValue,
    exceptionValue,
    processingTimeMs
  });

  // Save everything to DB store
  db.saveMatchesAndExceptions(recId, matchedGroups, exceptionsList, aiAnalysesList);

  const updatedRec = db.updateReconciliation(recId, {
    status: 'COMPLETED',
    records_processed: metrics.records_processed,
    matched_count: metrics.matched_count,
    probable_match_count: metrics.probable_match_count,
    exception_count: metrics.exception_count,
    unresolved_count: metrics.unresolved_count,
    match_rate: metrics.match_rate,
    auto_resolution_rate: metrics.auto_resolution_rate,
    total_transaction_value: metrics.total_transaction_value,
    reconciled_value: metrics.reconciled_value,
    exception_value: metrics.exception_value,
    processing_time_ms: processingTimeMs,
    completed_at: new Date().toISOString()
  });

  db.createAuditLog({
    entityType: 'RECONCILIATION',
    entityId: recId,
    action: 'RECONCILIATION_COMPLETED',
    metadata: {
      batchId,
      recordsProcessed: metrics.records_processed,
      matchRate: `${metrics.match_rate}%`,
      exceptionCount: metrics.exception_count,
      processingTimeMs
    }
  });

  return {
    reconciliation: updatedRec,
    metrics,
    matches: matchedGroups,
    exceptions: exceptionsList
  };
}
