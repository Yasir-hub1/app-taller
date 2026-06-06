import client from '../../api/client';
import { postMultipart } from '../../api/multipartUpload';
import { APP } from '../../constants/api';

export const technicianReportsApi = {
  voiceQuery: (formData) => postMultipart(`${APP}/technician/reports/voice-query/`, formData),
  voiceQueryText: (text) =>
    client.post(`${APP}/technician/reports/voice-query/`, { text }),
};
