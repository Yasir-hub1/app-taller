import client from './client';
import { postMultipart } from './multipartUpload';
import { APP } from '../constants/api';

export const incidentsApi = {
  create: (payload) =>
    client.post(`${APP}/incidents/`, payload),

  getAll: (params = {}) =>
    client.get(`${APP}/incidents/`, { params }),

  getById: (id) =>
    client.get(`${APP}/incidents/${id}/`),

  getAssignment: (id) =>
    client.get(`${APP}/incidents/${id}/assignment/`),

  cancel: (id) =>
    client.post(`${APP}/incidents/${id}/cancel/`),

  getStatusHistory: (id) =>
    client.get(`${APP}/incidents/${id}/status-history/`),

  uploadEvidence: (incidentId, formData) =>
    postMultipart(`${APP}/incidents/${incidentId}/upload-evidence/`, formData),

  getEvidences: (incidentId) =>
    client.get(`${APP}/incidents/${incidentId}/evidences/`),
};
