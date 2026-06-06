import client from './client';
import { postMultipart } from './multipartUpload';
import { APP } from '../constants/api';

export const clientReportsApi = {
  voiceQuery: (formData) => postMultipart(`${APP}/reports/voice-query/`, formData),
  voiceQueryText: (text) =>
    client.post(`${APP}/reports/voice-query/`, { text }),
};
