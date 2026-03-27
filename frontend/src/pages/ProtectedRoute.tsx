import { useContext, JSX } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "@/contexts/authContext";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, isLoading } = useContext(AuthContext);

    if (isLoading) return (<p>Loading...</p>);

    return (!isAuthenticated ? <Navigate to="/login" /> : children);
};
