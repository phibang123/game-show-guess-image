import axiosInstance from './axios';

export interface GameData {
  gameId: string;
  hostCode?: string;
  // Add other game related types here
}

const gameService = {
  getGame: async (gameId: string, hostCode?: string) => {
    const params = hostCode ? { gameId, hostCode } : { gameId };
    const response = await axiosInstance.get('/game', { params });
    return response.data;
  },

  createGame: async (data: Partial<GameData>) => {
    const response = await axiosInstance.post('/game', data);
    return response.data;
  },

  updateGame: async (data: Partial<GameData>) => {
    const response = await axiosInstance.put('/game', data);
    return response.data;
  },
};

export default gameService; 