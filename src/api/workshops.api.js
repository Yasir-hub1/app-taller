import client from './client';
import { APP } from '../constants/api';

export const workshopsApi = {
  // Corrección: el backend Django espera lat, lng como query params
  getNearby: (latitude, longitude, radius = 20) =>
    client.get(`${APP}/workshops/nearby/`, {
      params: { lat: latitude, lng: longitude, radius },
    }),

  getById: (id) =>
    client.get(`${APP}/workshops/${id}/`),

  rate: (id, score, comment = '') =>
    client.post(`${APP}/workshops/${id}/rate/`, { score, comment }),
};
