import { UserData } from "@/types/user";
import { AuthAPI } from '@/api/auth.api';
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { AlertContext } from "@/contexts/alertContext";
import { fetchWithRetry } from '@/utils/utils';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState<UserData | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const { showAlert } = useContext(AlertContext);

	useEffect(() => {
		checkSession();
	}, []);

	const checkSession = useCallback(async () => {
		try {
			const userData: UserData = await fetchWithRetry(() => AuthAPI.getMe())
			if (!userData) throw Error("User's data is missing");

			setIsAuthenticated(true);
			setUser(userData);
		} catch(err: any) {
			setIsAuthenticated(false);
			setUser(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const login = async () => await checkSession();
	
	const logout = async () => {
		try {
			await AuthAPI.logout();

			sessionStorage.clear();

			setUser(null);
			setIsAuthenticated(false);
			showAlert(true, "See you soon! You've successfully signed out.");
		} catch(err: any) {
			console.log("Failed to logout:", err.message);
			showAlert(false, "Oops! We couldn't log you out right now.");
		}
	};

	return (
		<AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};