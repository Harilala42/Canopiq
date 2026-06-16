import { apiClient } from '@/utils/axios.utils';
import { MessageData } from '@/types/chat';

export const MessageAPI = {
    getAll: async (chatId: string) => {
        const url = import.meta.env.VITE_API_CHAT_MESSAGE.replace("{chat_id}", chatId);
        const response = await apiClient.get<{ messages: MessageData[] }>(url);
        return response.data;
    },

    send: async (chatId: string, content: string) => {
        const url = import.meta.env.VITE_API_CHAT_MESSAGE.replace("{chat_id}", chatId);
        const response = await apiClient.post(url, { message: content });
        return response.data;
    }
};
