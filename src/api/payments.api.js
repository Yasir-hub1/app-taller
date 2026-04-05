import client from './client';
import { APP } from '../constants/api';

export const paymentsApi = {
  createIntent: (assignment_id) =>
    client.post(`${APP}/payments/create-intent/`, { assignment_id }),

  confirm: (payment_intent_id) =>
    client.post(`${APP}/payments/confirm/`, { payment_intent_id }),

  getHistory: () =>
    client.get(`${APP}/payments/history/`),

  getById: (id) =>
    client.get(`${APP}/payments/${id}/`),
};
