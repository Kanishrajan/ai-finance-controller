import { db } from '../db/store.js';

export function getAuditLogs(req, res) {
  const { limit = 100 } = req.query;
  const logs = db.getAuditLogs(parseInt(limit, 10) || 100);
  res.json({
    success: true,
    data: logs,
    count: logs.length
  });
}
