import logo from '@/assets/logo.svg';
import { useContext, JSX } from "react";
import { Navigate } from "react-router-dom";
import { HStack, Image, Text, Spinner } from '@chakra-ui/react';
import { ThemeContext } from '@/contexts/themeContext';
import { AuthContext } from "@/contexts/authContext";
import { FullScreen } from "@/components/FullScreen";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, isLoading } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);

    if (isLoading) {
        return (
            <FullScreen>
                <Image src={logo} alt="Canopiq Logo" w="100px" mb={5} />
                <HStack gap={4}>
                    <Spinner 
                        color={ theme === "dark" ? "text" : "secondary" } 
                        animationDuration="0.5s" 
                        borderWidth="5px"
                        size="md" 
                    />
                    <Text
                        color={ theme === "dark" ? "text" : "secondary" }  
                        className='title-style' fontSize="lg"
                    >
                        Loading...
                    </Text>
                </HStack>
            </FullScreen>
        );
    }

    return (!isAuthenticated ? <Navigate to="/login" /> : children);
};
