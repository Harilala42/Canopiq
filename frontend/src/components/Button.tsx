import { JSX, useContext } from 'react';
import { Button as ButtonChakra, Spinner, ButtonProps } from "@chakra-ui/react";
import { ThemeContext } from '@/contexts/themeContext';

export const Button = ({ children, ...props }: ButtonProps):JSX.Element => {
    const { theme } = useContext(ThemeContext);

    return (
        <ButtonChakra 
            w="full" minH="40px"
            bg={theme === "dark" ? "primary" : "secondary"} 
            fontSize="md" fontWeight="bold" borderRadius="xl"
            type="submit" className="title-styles" color="text"
            spinner={<Spinner size="sm" />}
            _hover={{ opacity: 0.9 }}
            { ...props }
        >
            { children }
        </ButtonChakra>
    );
}
