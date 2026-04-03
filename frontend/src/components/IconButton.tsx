import { useContext, JSX } from 'react';
import { IconButtonProps, IconButton as IconChakra } from '@chakra-ui/react';
import { ThemeContext } from '@/contexts/themeContext';

export const IconButton = (
    { children, ...props }: IconButtonProps
):JSX.Element => {
    const { theme } = useContext(ThemeContext);

    return (
        <IconChakra 
            variant="ghost" borderRadius={15}
            _hover={{ 
                bg: theme === "dark" ? "primary" : "secondary",
                color: theme === "dark" ? "text" : "text"
            }}
            color={theme === "dark" ? "text" : "secondary"}
            {...props}
        > 
            { children }
        </IconChakra>
    )
}
