import { JSX } from 'react';
import { Button, Spinner, ButtonProps } from "@chakra-ui/react";

interface SubmitButtonProps extends ButtonProps
{
    name: string;
}

export const SubmitButton = ({ name, ...props }: SubmitButtonProps):JSX.Element => {
    return (
        <Button bg="primary" w="full" h="50px" fontSize="lg" fontWeight="bold" borderRadius="xl"
            type="submit" className="title-styles" color="text"
            spinner={<Spinner size="sm" />}
            _hover={{ opacity: 0.9 }}
            { ...props }
        >{ name }
        </Button>
    );
}
