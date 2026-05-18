import { memo, JSX, useContext } from "react";
import {
	VStack,
	HStack,
	Text,
	Popover,
	Icon
} from "@chakra-ui/react";
import { LuBot, LuX } from "react-icons/lu";
import useChatStore from "@/stores/useChatStore";
import { ThemeContext } from "@/contexts/themeContext";
import { IconButton } from "@/components/IconButton";

interface ChatHeaderProps
{
	onClose: () => void;
}

const ChatHeader = memo(({ onClose }: ChatHeaderProps): JSX.Element => {
	const currentQuery = useChatStore((state) => state.currentQuery);

	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	return (
		<Popover.Header 
            w="100%" p={0}
            borderBottom="1px solid" 
            borderColor={isDark ? "variantDark" : "variantLight"}
        >
            <VStack w="100%" align="flex-start" p={2} gap={1}>
                <HStack  
                    align="center" justify="space-between" w="100%"
                    color={isDark ? "text" : "secondary"}
                    gap={2}
                >
                    <HStack align="center" justify="center" ml={2} gap={2}>
                        <Icon size="md" aria-label='AI Assistant Icon'>
                            <LuBot />
                        </Icon>

                        <Text className="title-styles" fontWeight="bold" fontSize="md" color={isDark ? "text" : "secondary"}>
                            AI Assistant
                        </Text>
                    </HStack>

                    <IconButton aria-label="Close Chat" size="sm" onClick={onClose}>
                        <LuX />
                    </IconButton>
                </HStack>
            
                <Text 
                    className="text-styles" 
                    fontSize="sm" opacity={0.7} ml={2}
                    color={isDark ? "text" : "secondary"}
                >
                    {currentQuery?.title || "New Chat"}
                </Text>
            </VStack>
        </Popover.Header>
	);
});

export default ChatHeader;
