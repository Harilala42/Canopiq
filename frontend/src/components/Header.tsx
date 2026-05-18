import { useContext, JSX } from 'react';
import { LuMoon, LuSun } from 'react-icons/lu';
import { HStack, Box, Text, Span, Avatar } from '@chakra-ui/react';
import { ThemeContext } from '@/contexts/themeContext';
import { AuthContext } from '@/contexts/authContext';
import { IconButton } from '@/components/IconButton';

export const Header = (): JSX.Element => {
    const { user } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    return (
        <HStack 
            align="center" 
            justify="space-between" 
            bg={ isDark ? "secondary" : "text" }
            borderBottom="1px solid" borderColor={ isDark ? "variantDark" : "variantLight" }
            w="100%" h="100%" p={4}
        >
            <Box display="flex" alignItems="center" gap={2}>
                <Text 
                    className="title-styles" 
                    fontSize="xl" fontWeight="bold"
                    color={ isDark ? "text" : "primary" }
                >
                    Canopi<Span color={ isDark ? "primary" : "secondary" }>q</Span>
                </Text>
            </Box>

            <Box display="flex" alignItems="center" gap={5}>
                <IconButton
                    aria-label={ isDark ? "Switch to light mode" : "Switch to dark mode" }
                    onClick={toggleTheme}
                > 
                    { isDark ? <LuSun /> : <LuMoon /> }
                </IconButton>

                <Avatar.Root 
                    as="button" aria-label="My profile"
                    bg={isDark ? "primary" : "secondary"}
                >
                    <Avatar.Fallback name={user?.username} className="title-styles" fontWeight="semibold" />
                    <Avatar.Image src={user?.avatar_url || undefined} />
                </Avatar.Root>
            </Box>
        </HStack>
    )
}
