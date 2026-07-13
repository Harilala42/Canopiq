import { apiClient } from '@/utils/axios.utils';
import { LoginFormData, RegisterFormData } from '@/types/auth';
import { UserData } from "@/types/user";

export const AuthAPI = {
    register: async (formData: RegisterFormData) => {
        const response = await apiClient.post(import.meta.env.VITE_API_AUTH_REGISTER, formData);
        return response.data;
    },

    loginWithPassword: async (formData: LoginFormData) => {
        const response = await apiClient.post(import.meta.env.VITE_API_AUTH_LOGIN_WITH_PASSWORD, formData);
        return response.data;
    },

    getGoogleAuthUrl: async () => {
        const response = await apiClient.get<{ url: string }>(import.meta.env.VITE_API_AUTH_LOGIN_WITH_GOOGLE);
        return response.data;
    },

    getMe: async (): Promise<UserData> => {
        const response = await apiClient.get<UserData>(import.meta.env.VITE_API_AUTH_GET_ME);
        return response.data;
    },

    logout: async () => {
        const response = await apiClient.post(import.meta.env.VITE_API_AUTH_LOGOUT);
        return response.data;
    }
};
