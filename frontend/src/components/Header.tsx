import logo from '@/assets/logo.svg';
import { useContext, JSX } from 'react';
import { LuMoon, LuSun } from 'react-icons/lu';
import { HStack, Box, Text, Image, Span, IconButton, Avatar } from '@chakra-ui/react';
import { ThemeContext } from '@/contexts/themeContext';
import { AuthContext } from '@/contexts/authContext';

export const Header = (): JSX.Element => {
    const { user } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <HStack 
            align="center" 
            justify="space-between" 
            bg={ theme === "dark" ? "secondary" : "primary" }
            borderBottom="1px solid"
            borderColor="text" 
            px={8} py={4} w="100%"
        >
            <Box display="flex" alignItems="center" gap={2}>
                <Image src={logo} alt="Canopiq logo" boxSize="30px" />
                <Text className="title-styles" fontSize="xl" fontWeight="bold">
                    Canopi<Span color={ theme === "dark" ? "primary" : "secondary" }>q</Span>
                </Text>
            </Box>

            <Box display="flex" alignItems="center" gap={5}>
                <IconButton 
                    aria-label="Notifications" 
                    variant="ghost" color="white" borderRadius={15}
                    _hover={{ bg: theme === "dark" ? "primary" : "secondary" }}
                    onClick={toggleTheme}
                > 
                    { theme === "dark" ? <LuSun /> : <LuMoon /> }
                </IconButton>

                <Avatar.Root as="button" bg={ theme === "dark" ? "primary" : "secondary" } borderRadius={15}>
                    <Avatar.Fallback name={user?.username} className="title-styles" fontWeight="semibold" />
                    <Avatar.Image src={user?.avatar_ur || undefined} />
                </Avatar.Root>
            </Box>
        </HStack>
    )
}
