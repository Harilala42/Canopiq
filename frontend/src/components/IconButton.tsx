import { useContext, JSX } from 'react';
import { IconButtonProps, IconButton as IconChakra } from '@chakra-ui/react';
import { ThemeContext } from '@/contexts/themeContext';

export const IconButton = (
    { children, ...props }: IconButtonProps
):JSX.Element => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    return (
        <IconChakra 
            variant="ghost" borderRadius={15}
            _disabled={{ 
                bg: isDark ? "primary" : "secondary",
                color: isDark ? "text" : "text"
            }}
            color={isDark ? "text" : "secondary"}
            {...props}
        > 
            { children }
        </IconChakra>
    )
}
