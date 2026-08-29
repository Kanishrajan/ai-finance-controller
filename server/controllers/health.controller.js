import { db } from '../db/store.js';

export function getHealth(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI Finance Controller API',
    uptime: process.uptime()
  });
}

export function getReadiness(req, res) {
  const datasetsCount = db.getAllDatasets().length;
  const reconciliationsCount = db.getAllReconciliations().length;

  res.json({
    status: 'ready',
    database: 'connected (in-memory relational store)',
    datasets_indexed: datasetsCount,
    reconciliations_processed: reconciliationsCount,
    ai_engine: process.env.GEMINI_API_KEY ? 'gemini-3.7-flash (active)' : 'deterministic-rule-fallback (active)'
  });
}
