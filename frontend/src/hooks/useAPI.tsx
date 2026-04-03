import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

interface ExecuteOptions<T = any>
{
	url: string;
	method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
	body?: T | null;
	params?: Record<string, any> | null;
}

interface APIData<T = any>
{
	data: T | null;
  	error: any;
	isLoading: boolean,
	execute(
		options: ExecuteOptions<T>
	): Promise<T>;
}

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	withCredentials: true,
	timeout: 15000,
});

// Interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (err: any) => {
        const originalRequest = err.config;
		const status: number = err.response?.status;
		const code: string = err.response?.data?.detail?.code;

        if (status === 401 && code === "TOKEN_EXPIRED" && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                await api.post(import.meta.env.VITE_API_AUTH_REFRESH_TOKEN);
                
                return api(originalRequest);
            } catch (refreshError) {
				try {
                    await api.post(import.meta.env.VITE_API_AUTH_LOGOUT);
                } catch (_) {
                    // ignore logout errors
                }

				sessionStorage.clear();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }
		
        return Promise.reject(err);
    }
);

const useApi = <T = any>(): APIData<T> => {
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState<any>(null);

	const execute = useCallback(
	async ({
		url,
		method = "GET",
		body = null,
		params = null
	}: ExecuteOptions<T>): Promise<T> => {
		setError(null);
		setIsLoading(true);

		try {
			const response = await api({ 
				url, 
				method,
				data: body,
				params
			});

			setData(response.data);
			return (response.data);
		} catch (err: any) {
			const axiosError: any = err as AxiosError;
			const detail: any = axiosError.response?.data?.detail;
			let errorMessage: string;

			if (typeof detail === "object" && detail?.message)
				errorMessage = detail.message;
			else if (Array.isArray(detail) && detail[0]?.msg)
				errorMessage = "Invalid input provided";
			else
				errorMessage = 'Something went wrong';

			setError(errorMessage);
			throw new Error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	return ({ data, error, isLoading, execute });
};

export default useApi;
