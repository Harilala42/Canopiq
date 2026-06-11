import { apiClient } from '@/utils/axios.utils';

export const JobAPI = {
    cancelJob: async (chatId: string, jobId: string) => {
        const url = import.meta.env.VITE_API_JOB.replace("{chat_id}", chatId);
        const response = await apiClient.delete(url, {
            params: { task_id: jobId }
        });
        return response.data;
    }
};
