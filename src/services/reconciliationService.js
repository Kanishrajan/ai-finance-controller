import api from './api.js';

export const reconciliationService = {
  runDemo: async () => {
    const res = await api.post('/demo/run');
    return res.data;
  },

  resetDemo: async () => {
    const res = await api.post('/demo/reset');
    return res.data;
  },

  createReconciliation: async (payload) => {
    const res = await api.post('/reconciliations', payload);
    return res.data;
  },

  getAllReconciliations: async () => {
    const res = await api.get('/reconciliations');
    return res.data;
  },

  getReconciliationById: async (id) => {
    const res = await api.get(`/reconciliations/${id}`);
    return res.data;
  },

  getMetrics: async (id = 'latest') => {
    const res = await api.get(`/reconciliations/${id}/metrics`);
    return res.data;
  },

  getAllTransactions: async (params) => {
    const res = await api.get('/transactions', { params });
    return res.data;
  },

  getTransactionDetails: async (id) => {
    const res = await api.get(`/transactions/${id}`);
    return res.data;
  }
};
