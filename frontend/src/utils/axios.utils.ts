import axios, { AxiosError } from 'axios';
import { syncRealtimeSession } from '@/utils/supabase.utils';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    timeout: 30000,
});

const ERROR_MESSAGES: Record<string | number, string> = {
    400: "The request was invalid. Please check your input and try again.",
    403: "You don't have permission to perform this action.",
    404: "The requested resource could not be found.",
    429: "Too many requests. Please slow down and try again in a moment.",
    500: "Our servers are having trouble right now. Please try again later.",

    "INVALID_CREDENTIALS": "The email or password you entered is incorrect.",
    "EMAIL_ALREADY_USED": "An account with this email already exists.",
    "EMAIL_NOT_CONFIRMED": "The email isn't confirmed yet. Please verify your email."
};

// Interceptor to handle token refresh and error formatting
apiClient.interceptors.response.use(
    (response) => response,
    async (err: AxiosError | any) => {
        const originalRequest = err.config;
        const status: number = err.response?.status;
        const code: string = err.response?.data?.detail?.code;

        // 1. Handle Token Refresh
        if (status === 401 && code === "TOKEN_EXPIRED" && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                await apiClient.post(import.meta.env.VITE_API_AUTH_REFRESH_TOKEN);
                await syncRealtimeSession();
                
                return apiClient(originalRequest);
            } catch (refreshError) {
                try {
                    await apiClient.post(import.meta.env.VITE_API_AUTH_LOGOUT);
                } catch (err: any) {
                    // ignore logout errors
                }

                sessionStorage.clear();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }
        
        // 2. Handle API Errors
        let errorMessage = 'Something went wrong. Please try again later.';
        if (code && ERROR_MESSAGES[code]) {
            errorMessage = ERROR_MESSAGES[code];
        } else if (status && ERROR_MESSAGES[status]) {
            errorMessage = ERROR_MESSAGES[status];
        } else if (err.message?.includes('Network Error')) {
            errorMessage = "Network error. Please check your internet connection.";
        }

        err.message = errorMessage; 
        return Promise.reject(err);
    }
);
