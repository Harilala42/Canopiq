import { JSX, useContext } from 'react';
import { Button, Spinner, ButtonProps } from "@chakra-ui/react";
import { ThemeContext } from '@/contexts/themeContext';

interface SubmitButtonProps extends ButtonProps
{
    name: string;
}

export const SubmitButton = ({ name, ...props }: SubmitButtonProps):JSX.Element => {
    const { theme } = useContext(ThemeContext);

    return (
        <Button 
            w="full" h="50px"
            bg={theme === "dark" ? "primary" : "secondary"} 
            fontSize="lg" fontWeight="bold" borderRadius="xl"
            type="submit" className="title-styles" color="text"
            spinner={<Spinner size="sm" />}
            _hover={{ opacity: 0.9 }}
            { ...props }
        >{ name }
        </Button>
    );
}
