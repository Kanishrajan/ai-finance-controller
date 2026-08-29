import { db } from '../db/store.js';

export function getAllExceptions(req, res) {
  const {
    reconciliation_id,
    type,
    status,
    severity,
    confidence_min,
    confidence_max,
    search,
    page = 1,
    limit = 25,
    sortBy = 'severity',
    sortOrder = 'desc'
  } = req.query;

  const rec = reconciliation_id ? db.getReconciliation(reconciliation_id) : db.getLatestReconciliation();
  let exceptions = rec ? db.getExceptionsByReconciliation(rec.id) : [];

  if (type && type !== 'ALL') {
    exceptions = exceptions.filter(e => e.type === type);
  }

  if (status && status !== 'ALL') {
    exceptions = exceptions.filter(e => e.status === status);
  }

  if (severity && severity !== 'ALL') {
    exceptions = exceptions.filter(e => e.severity === severity);
  }

  if (confidence_min) {
    const cMin = parseFloat(confidence_min);
    if (!isNaN(cMin)) exceptions = exceptions.filter(e => e.confidence >= cMin);
  }

  if (confidence_max) {
    const cMax = parseFloat(confidence_max);
    if (!isNaN(cMax)) exceptions = exceptions.filter(e => e.confidence <= cMax);
  }

  if (search) {
    const q = search.toLowerCase();
    exceptions = exceptions.filter(e => {
      const txId = e.transaction_id?.toLowerCase() || '';
      const bankM = e.bankTx?.merchant?.toLowerCase() || '';
      const gwM = e.gatewayTx?.merchant?.toLowerCase() || '';
      const desc = e.description?.toLowerCase() || '';
      return txId.includes(q) || bankM.includes(q) || gwM.includes(q) || desc.includes(q);
    });
  }

  // Sort
  const severityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  exceptions.sort((a, b) => {
    let valA = a.amount || 0;
    let valB = b.amount || 0;

    if (sortBy === 'severity') {
      valA = severityRank[a.severity] || 0;
      valB = severityRank[b.severity] || 0;
    } else if (sortBy === 'confidence') {
      valA = a.confidence || 0;
      valB = b.confidence || 0;
    } else if (sortBy === 'difference') {
      valA = Math.abs(a.difference || 0);
      valB = Math.abs(b.difference || 0);
    }

    if (sortOrder === 'asc') return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const total = exceptions.length;
  const totalPages = Math.ceil(total / l);
  const offset = (p - 1) * l;
  const paginated = exceptions.slice(offset, offset + l);

  res.json({
    success: true,
    data: paginated,
    pagination: {
      page: p,
      limit: l,
      total,
      total_pages: totalPages
    },
    counts: {
      total: exceptions.length,
      open: exceptions.filter(e => e.status === 'OPEN').length,
      resolved: exceptions.filter(e => e.status === 'RESOLVED').length,
      rejected: exceptions.filter(e => e.status === 'REJECTED').length
    }
  });
}

export function getExceptionById(req, res) {
  const { id } = req.params;
  const exception = db.getExceptionById(id);
  if (!exception) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Exception record not found.' }
    });
  }

  res.json({
    success: true,
    data: exception
  });
}

export function resolveException(req, res, next) {
  try {
    const { id } = req.params;
    const { decision = 'ACCEPT_MATCH', note = '', user_name = 'Marcus Chen (Senior Analyst)', user_id = 'usr-analyst-1' } = req.body;

    const updated = db.resolveException(id, {
      decision,
      note,
      userId: user_id,
      userName: user_name
    });

    res.json({
      success: true,
      message: 'Exception marked as resolved and verified.',
      data: updated
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.statusCode === 409 ? 'CONFLICT' : 'ERROR', message: err.message }
      });
    }
    next(err);
  }
}

export function rejectException(req, res, next) {
  try {
    const { id } = req.params;
    const { decision = 'REJECT_MATCH', note = '', user_name = 'Marcus Chen (Senior Analyst)', user_id = 'usr-analyst-1' } = req.body;

    const updated = db.resolveException(id, {
      decision: 'REJECT_MATCH',
      note,
      userId: user_id,
      userName: user_name
    });

    res.json({
      success: true,
      message: 'Exception rejected and logged for audit escalation.',
      data: updated
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: err.statusCode === 409 ? 'CONFLICT' : 'ERROR', message: err.message }
      });
    }
    next(err);
  }
}

export function addExceptionNote(req, res, next) {
  try {
    const { id } = req.params;
    const { note, user_name = 'Marcus Chen (Senior Analyst)' } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Note text cannot be empty.' }
      });
    }

    const noteEntry = db.addExceptionNote(id, { note, userName: user_name });
    res.status(201).json({
      success: true,
      data: noteEntry
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: { code: 'NOT_FOUND', message: err.message }
      });
    }
    next(err);
  }
}
