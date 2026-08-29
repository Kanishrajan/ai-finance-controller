import api from './api.js';

export const datasetService = {
  uploadDataset: async (payload) => {
    const res = await api.post('/datasets/upload', payload);
    return res.data;
  },

  getAllDatasets: async () => {
    const res = await api.get('/datasets');
    return res.data;
  },

  getDatasetById: async (id) => {
    const res = await api.get(`/datasets/${id}`);
    return res.data;
  }
};

export const exceptionService = {
  getAllExceptions: async (params) => {
    const res = await api.get('/exceptions', { params });
    return res.data;
  },

  getExceptionById: async (id) => {
    const res = await api.get(`/exceptions/${id}`);
    return res.data;
  },

  resolveException: async (id, payload) => {
    const res = await api.post(`/exceptions/${id}/resolve`, payload);
    return res.data;
  },

  rejectException: async (id, payload) => {
    const res = await api.post(`/exceptions/${id}/reject`, payload);
    return res.data;
  },

  addNote: async (id, payload) => {
    const res = await api.post(`/exceptions/${id}/notes`, payload);
    return res.data;
  }
};

export const reportService = {
  getReportById: async (id = 'latest') => {
    const res = await api.get(`/reports/${id}`);
    return res.data;
  },

  getCsvDownloadUrl: (id = 'latest') => {
    return `/api/v1/reports/${id}/csv`;
  }
};

export const auditService = {
  getAuditLogs: async (limit = 100) => {
    const res = await api.get('/audit-logs', { params: { limit } });
    return res.data;
  }
};
