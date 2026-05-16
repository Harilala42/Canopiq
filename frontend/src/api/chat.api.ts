import { apiClient } from '@/utils/axios.utils';
import { ChatData } from '@/types/chat';

export const ChatAPI = {
    getAll: async () => {
        const response = await apiClient.get<{ chats: ChatData[] }>(import.meta.env.VITE_API_CHAT);
        return response.data;
    },

    create: async () => {
        const response = await apiClient.post<{ chat: ChatData }>(import.meta.env.VITE_API_CHAT_NEW);
        return response.data;
    },

    rename: async (chatId: string, newTitle: string) => {
        const url = import.meta.env.VITE_API_CHAT_MESSAGE.replace("{chat_id}", chatId);
        const response = await apiClient.patch(url, { new_title: newTitle });
        return response.data;
    },

    delete: async (chatId: string) => {
        const url = import.meta.env.VITE_API_CHAT_MESSAGE.replace("{chat_id}", chatId);
        const response = await apiClient.delete(url);
        return response.data;
    },

    togglePin: async (chatId: string, isPinned: boolean) => {
        const url = import.meta.env.VITE_API_CHAT_TOGGLE_PIN.replace("{chat_id}", chatId);
        const response = await apiClient.patch(url, { is_pinned: isPinned });
        return response.data;
    }
};
