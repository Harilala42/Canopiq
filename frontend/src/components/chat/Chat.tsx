import {
    ChatHeader,
    ChatMessages,
    ChatInputBar
} from "@/components/chat";
import { JSX, useContext } from "react";
import { VStack } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";
import { useChatController } from "@/hooks/useChatController";

const Chat = (): JSX.Element => {
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

    const { title } = useChatController();

	return (
		<VStack
            align="stretch"
            bg={isDark ? "secondary" : "text"}
            w="100%" h="100%"
            maxH="calc(100vh - 60px)"
            overflow="hidden"
            gap={0}
        >
            <ChatHeader title={title} />

            <ChatMessages />

            <ChatInputBar />
        </VStack>
	);
};

export default Chat;
