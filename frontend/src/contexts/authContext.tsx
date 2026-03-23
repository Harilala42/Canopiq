import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const isTokenExpired = (token: string): boolean => {
		if (token) {
			const decoded: any = jwtDecode(token);
			const currentTime: number = Date.now() / 1000;

			if (decoded.exp < currentTime) {
				console.warn("JWT token is expired");
				setIsLoggedIn(false);
				return (true);
			}

			setIsLoggedIn(true);
		}
		return (false);
	};

	useEffect(() => {
		isTokenExpired(localStorage.getItem("token")) && logout();
		setIsLoading(false);
	}, []);

	const getToken = (): string | null => {
		const token: string = localStorage.getItem("token");
		if (!token || isTokenExpired(token)) {
			logout();
			return (null);
		}

		return (token);
	}

	const login = (accessToken: string) => {
		localStorage.setItem("token", accessToken);
		setIsLoggedIn(true);
	};

	const logout = () => {
		localStorage.removeItem("token");
		sessionStorage.clear();
		setIsLoggedIn(false);
	};

	return (
		<AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout, getToken }}>
			{children}
		</AuthContext.Provider>
	);
};