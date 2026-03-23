import { useState, useCallback, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import axios, { AxiosError } from 'axios';

interface ExecuteOptions<T = any>
{
	url: string;
	method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
	body?: T | null;
	params?: Record<string, any> | null; 
	useToken?: boolean;
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
	baseURL: "http://localhost:8000/",
	timeout: 15000
});

const useApi = <T = any>(): APIData<T> => {
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState<any>(null);
	const { getToken } = useContext(AuthContext);

	const execute = useCallback(
	async ({
		url,
		useToken = false,
		method = "GET",
		body = null,
		params = null
	}: ExecuteOptions<T>): Promise<T> => {
		setError(null);
		setIsLoading(true);

		try {
			const headers: Record<string, string> = {};
			if (useToken) {
				const token: string | null = getToken();
				if (token) headers['Authorization'] = `Bearer ${token}`;
			}

			const response = await api({ 
				url, 
				method, 
				headers,
				data: body,
				params
			});

			setData(response.data);
			return (response.data);
		} catch (err: any) {
			const axiosError = err as AxiosError<{ message?: string }>;
			const errorMessage = axiosError.response?.data?.message || err.message || 'Something went wrong';
			
			setError(errorMessage);
			throw new Error(`Failed to call ${url}: ` + errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	return ({ data, error, isLoading, execute });
};

export default useApi;
