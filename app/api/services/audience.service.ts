import axiosInstance from './axios';

export interface AudienceData {
  gameId: string;
  name: string;
  // Add other audience related types here
}

const audienceService = {
  getAudience: async (gameId: string) => {
    const response = await axiosInstance.get('/audience', { params: { gameId } });
    return response.data;
  },

  createAudience: async (data: AudienceData) => {
    const response = await axiosInstance.post('/audience', data);
    return response.data;
  },

  updateAudience: async (data: Partial<AudienceData>) => {
    const response = await axiosInstance.put('/audience', data);
    return response.data;
  },
};

export default audienceService; 