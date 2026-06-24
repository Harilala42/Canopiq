import { memo, JSX, useContext } from "react";
import { VStack, HStack, Text, Icon, Spinner } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";
import { LuBot } from "react-icons/lu";

interface ChatHeaderProps
{
	title: string;
}

const ChatHeader = memo(({title}: ChatHeaderProps): JSX.Element => {
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	return (
		<VStack 
            w="100%" 
            align="flex-start"
            borderBottom="1px solid"
			borderColor={isDark ? "variantDark" : "variantLight"} 
            py={4} px={2} gap={2}
        >
            <HStack color={isDark ? "text" : "secondary"} w="100%" ml={2} gap={2}>
                <Icon size="md" aria-label='AI Assistant Icon'>
                    <LuBot />
                </Icon>

                <Text className="title-styles" fontWeight="bold" fontSize="md" color={isDark ? "text" : "secondary"}>
                    AI Assistant
                </Text>
            </HStack>
        
            <Text 
                className="text-styles" 
                fontSize="sm" opacity={0.7} ml={2}
                color={isDark ? "text" : "secondary"}
            >
                {title}
            </Text>
        </VStack>
	);
});

export default ChatHeader;
