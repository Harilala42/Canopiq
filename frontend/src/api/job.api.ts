import { apiClient } from '@/utils/axios.utils';

export const JobAPI = {
    cancelJob: async (jobId: string) => {
        const url = import.meta.env.VITE_API_JOB.replace("{job_id}", jobId);
        const response = await apiClient.delete(url);
        return response.data;
    }
};
