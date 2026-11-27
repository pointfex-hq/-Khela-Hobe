import apiClient from '../api/apiClient';
import { unwrapEnvelope } from '../../utils/dtoMappers';

/**
 * AWS S3 Image Upload Service
 */
export const uploadService = {
  uploadImage: async (file, folder = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await apiClient.post('/uploads', formData);
    const data = unwrapEnvelope(response);
    return {
      success: true,
      url: data?.url,
      key: data?.key,
    };
  },
};

export default uploadService;
