import { apiClient } from '@/utils/axios.utils';

export const AnalysisAPI = {
    getAll: async (chatId: string) => {
        const url = import.meta.env.VITE_API_GEO_ANALYSIS.replace("{chat_id}", chatId);
        const response = await apiClient.get(url);
        return response.data;
    },

    getMap: async (h3GridMapId: string) => {
        const url = import.meta.env.VITE_API_GEO_ANALYSIS_MAP.replace("{h3_grid_map_id}", h3GridMapId);
        const response = await apiClient.get(url);
        return response.data;
    }
};
