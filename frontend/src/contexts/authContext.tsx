import useApi from '@/hooks/useAPI';
import { UserData } from "@/types/user";
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { AlertContext } from "@/contexts/alertContext";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState<UserData | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const { showAlert } = useContext(AlertContext);
	const { execute } = useApi();

	useEffect(() => {
		checkSession();
	}, []);

	const checkSession = useCallback(async () => {
		try {
			const userData: UserData = await execute({ 
                url: import.meta.env.VITE_API_AUTH_GET_ME
            });

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
			await execute({
				url: import.meta.env.VITE_API_AUTH_LOGOUT,
				method: "POST"
			});

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