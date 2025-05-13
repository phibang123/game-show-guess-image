import axiosInstance from './axios';

export interface TeamData {
  gameId: string;
  teamName: string;
  // Add other team related types here
}

const teamService = {
  getTeam: async (gameId: string) => {
    const response = await axiosInstance.get('/team', { params: { gameId } });
    return response.data;
  },

  createTeam: async (data: TeamData) => {
    const response = await axiosInstance.post('/team', data);
    return response.data;
  },

  updateTeam: async (data: Partial<TeamData>) => {
    const response = await axiosInstance.put('/team', data);
    return response.data;
  },
};

export default teamService; 