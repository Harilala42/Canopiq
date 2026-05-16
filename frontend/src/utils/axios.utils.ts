import axios, { AxiosError } from 'axios';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    timeout: 15000,
});

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
                return apiClient(originalRequest);
            } catch (refreshError) {
                try {
                    await apiClient.post(import.meta.env.VITE_API_AUTH_LOGOUT);
                } catch (_) {
                    // ignore logout errors
                }

                sessionStorage.clear();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }
        
        // 2. Handle API Errors
        const detail: any = err.response?.data?.detail;
        let errorMessage = 'Something went wrong';

        if (typeof detail === "object" && detail?.message)
            errorMessage = detail.message;
        else if (Array.isArray(detail) && detail[0]?.msg)
            errorMessage = "Invalid input provided";
        else if (err.message)
            errorMessage = err.message;

        err.formattedMessage = errorMessage;
        return Promise.reject(err);
    }
);
