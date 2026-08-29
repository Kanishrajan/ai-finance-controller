import { db } from '../db/store.js';
import Papa from 'papaparse';

export async function uploadDataset(req, res, next) {
  try {
    const { sourceType, name, fileName, content, records: directRecords } = req.body;

    if (!sourceType || !['BANK', 'PAYMENT_GATEWAY', 'INTERNAL_LEDGER'].includes(sourceType)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SOURCE_TYPE', message: 'source_type must be BANK, PAYMENT_GATEWAY, or INTERNAL_LEDGER' }
      });
    }

    let parsedRecords = directRecords || [];

    if (content && typeof content === 'string') {
      const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
      if (parsed.errors && parsed.errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'MALFORMED_CSV', message: parsed.errors[0].message }
        });
      }
      parsedRecords = parsed.data;
    }

    if (!Array.isArray(parsedRecords) || parsedRecords.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_DATASET', message: 'Uploaded dataset contains no valid transaction records.' }
      });
    }

    // Validate required fields
    const requiredFields = ['transaction_id', 'merchant', 'amount'];
    for (let i = 0; i < Math.min(10, parsedRecords.length); i++) {
      const row = parsedRecords[i];
      for (const field of requiredFields) {
        if (row[field] === undefined && row[field.toUpperCase()] === undefined) {
          return res.status(400).json({
            success: false,
            error: { code: 'MISSING_COLUMN', message: `Required column '${field}' missing in dataset row ${i + 1}.` }
          });
        }
      }
    }

    const dataset = db.createDataset({
      name: name || `${sourceType} Import`,
      sourceType,
      fileName: fileName || `${sourceType.toLowerCase()}_upload.csv`,
      records: parsedRecords
    });

    return res.status(201).json({
      success: true,
      data: {
        dataset_id: dataset.id,
        source_type: dataset.source_type,
        record_count: dataset.record_count,
        status: dataset.status,
        created_at: dataset.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

export function getAllDatasets(req, res) {
  const datasets = db.getAllDatasets();
  res.json({
    success: true,
    data: datasets
  });
}

export function getDatasetById(req, res) {
  const dataset = db.getDataset(req.params.id);
  if (!dataset) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Dataset not found.' }
    });
  }
  const transactions = db.getTransactionsByDataset(dataset.id);
  res.json({
    success: true,
    data: {
      ...dataset,
      transactions: transactions.slice(0, 100)
    }
  });
}
