import { db } from '../db/store.js';

export function getAllTransactions(req, res) {
  const { page = 1, limit = 25, search = '', classification = '', status = '', sortBy = 'date', sortOrder = 'desc' } = req.query;
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const latestRec = db.getLatestReconciliation();
  let matches = latestRec ? db.getMatchesByReconciliation(latestRec.id) : [];

  // Filter
  if (search) {
    const q = search.toLowerCase();
    matches = matches.filter(m => {
      const bankId = m.bankTx?.external_transaction_id?.toLowerCase() || '';
      const bankM = m.bankTx?.merchant?.toLowerCase() || '';
      const gwM = m.gatewayTx?.merchant?.toLowerCase() || '';
      const ledM = m.ledgerTx?.merchant?.toLowerCase() || '';
      const ref = m.bankTx?.reference_id?.toLowerCase() || '';
      return bankId.includes(q) || bankM.includes(q) || gwM.includes(q) || ledM.includes(q) || ref.includes(q);
    });
  }

  if (classification && classification !== 'ALL') {
    matches = matches.filter(m => m.classification === classification);
  }

  if (status && status !== 'ALL') {
    matches = matches.filter(m => m.status === status);
  }

  // Sort
  matches.sort((a, b) => {
    let valA = a.bankTx?.transaction_date || a.gatewayTx?.transaction_date || '';
    let valB = b.bankTx?.transaction_date || b.gatewayTx?.transaction_date || '';

    if (sortBy === 'amount') {
      valA = a.bankTx?.amount || a.gatewayTx?.amount || 0;
      valB = b.bankTx?.amount || b.gatewayTx?.amount || 0;
    } else if (sortBy === 'confidence') {
      valA = a.confidence || 0;
      valB = b.confidence || 0;
    }

    if (sortOrder === 'asc') return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  const total = matches.length;
  const totalPages = Math.ceil(total / l);
  const offset = (p - 1) * l;
  const paginated = matches.slice(offset, offset + l);

  res.json({
    success: true,
    data: paginated,
    pagination: {
      page: p,
      limit: l,
      total,
      total_pages: totalPages
    }
  });
}

export function getTransactionDetails(req, res) {
  const { id } = req.params;
  const latestRec = db.getLatestReconciliation();
  const allMatches = latestRec ? db.getMatchesByReconciliation(latestRec.id) : [];

  // Search by match ID, external transaction ID, or reference ID
  let match = allMatches.find(m =>
    m.id === id ||
    m.bankTx?.external_transaction_id === id ||
    m.gatewayTx?.external_transaction_id === id ||
    m.ledgerTx?.external_transaction_id === id ||
    m.bankTx?.reference_id === id
  );

  // If not found in matches, check raw transactions
  let rawTx = null;
  if (!match) {
    rawTx = db.getTransactionById(id);
  }

  if (!match && !rawTx) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Transaction record '${id}' not found.` }
    });
  }

  const aiAnalysis = match ? db.getAIAnalysisByMatchId(match.id) : null;
  const allExceptions = latestRec ? db.getExceptionsByReconciliation(latestRec.id) : [];
  const exception = match ? allExceptions.find(e => e.match_id === match.id) : null;

  res.json({
    success: true,
    data: {
      transaction_id: id,
      match_id: match ? match.id : null,
      sources: {
        bank: match ? match.bankTx : (rawTx?.source_type === 'BANK' ? rawTx : null),
        gateway: match ? match.gatewayTx : (rawTx?.source_type === 'PAYMENT_GATEWAY' ? rawTx : null),
        ledger: match ? match.ledgerTx : (rawTx?.source_type === 'INTERNAL_LEDGER' ? rawTx : null)
      },
      classification: match ? match.classification : 'UNRESOLVED',
      confidence: match ? match.confidence : 0.5,
      amount_difference: match ? match.amount_difference : 0,
      matching_method: match ? match.matching_method : 'DIRECT_LOOKUP',
      explanation: match ? match.explanation : 'Transaction retrieved from raw dataset index.',
      status: match ? match.status : 'OPEN',
      ai_analysis: aiAnalysis || match?.ai_analysis || null,
      exception: exception || null
    }
  });
}
