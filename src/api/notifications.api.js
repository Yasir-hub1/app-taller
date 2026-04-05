import client from './client';
import { APP } from '../constants/api';

export const notificationsApi = {
  getAll: () =>
    client.get(`${APP}/notifications/`),

  markAsRead: (id) =>
    client.post(`${APP}/notifications/${id}/read/`),

  markAllAsRead: () =>
    client.post(`${APP}/notifications/read-all/`),

  getUnreadCount: () =>
    client.get(`${APP}/notifications/unread-count/`),
};
