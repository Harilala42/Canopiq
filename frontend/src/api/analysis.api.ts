import { apiClient } from '@/utils/axios.utils';

export const AnalysisAPI = {
    getAnalysis: async (geoAnalysisId: string) => {
        const url = import.meta.env.VITE_API_GEO_ANALYSIS.replace("{geo_analysis_id}", geoAnalysisId);
        const response = await apiClient.get(url);
        return response.data;
    },

    getMap: async (geoAnalysisId: string, h3GridMapId: string) => {
        const url = import.meta.env.VITE_API_GEO_ANALYSIS.replace("{geo_analysis_id}", geoAnalysisId);
        const response = await apiClient.post(url, {
            h3_grid_map_id: h3GridMapId
        });
        return response.data;
    }
};
