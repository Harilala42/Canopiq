import { apiClient } from '@/utils/axios.utils';
import { JobData } from '@/types/job';

export const JobAPI = {
    getJob: async (jobId: string) => {
        const url = import.meta.env.VITE_API_JOB.replace("{job_id}", jobId);
        const response = await apiClient.get<{ job: JobData }>(url);
        return response.data;
    },
    
    cancelJob: async (jobId: string) => {
        const url = import.meta.env.VITE_API_JOB.replace("{job_id}", jobId);
        const response = await apiClient.delete(url);
        return response.data;
    }
};
