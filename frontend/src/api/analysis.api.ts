import { apiClient } from '@/utils/axios.utils';

export const AnalysisAPI = {
    getAll: async (chatId: string) => {
        const url = import.meta.env.VITE_API_GEO_ANALYSIS.replace("{chat_id}", chatId);
        const response = await apiClient.get(url);
        return response.data;
    },

    getMap: async (chatId: string, geoAnalysisId: string) => {
        const url = import.meta.env.VITE_API_GEO_ANALYSIS.replace("{chat_id}", chatId);
        const response = await apiClient.post(url, {
            geo_analysis_id: geoAnalysisId
        });
        return response.data;
    }
};
