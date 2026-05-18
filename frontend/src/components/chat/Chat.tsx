import {
    ChatHeader,
    ChatMessages,
    ChatInputBar
} from "@/components/chat";
import { JSX, useContext } from "react";
import { Popover, Portal, VStack } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { LuBotMessageSquare, LuX } from "react-icons/lu";
import { ThemeContext } from "@/contexts/themeContext";
import { useChatController } from "@/hooks/useChatController";
import { IconButton } from "@/components/IconButton";

const Chat = (): JSX.Element => {
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	const {
		isOpen,
		isVisible,
		toggleChat,
		closeChat
	} = useChatController();

	return (
		<Popover.Root open={isOpen} positioning={{ placement: "top-start" }}>
            <Popover.Trigger asChild>
                <IconButton
                    size="xl"
                    position="absolute"
                    bottom="20px" left="20px"
                    zIndex={1000} borderRadius="full"
                    bg={isDark ? "secondary" : "text"}
                    aria-label='Bot Message Button'
                    onClick={toggleChat}
                >
                    {!isOpen ? <LuBotMessageSquare /> : <LuX />}
                </IconButton>
            </Popover.Trigger>

            <Portal>
                <Popover.Positioner>
                    <AnimatePresence>
                        {isVisible && (
                            <Popover.Content asChild w="fit-content" boxShadow="none" borderRadius={0}>
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "75vh", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <VStack
                                        align="stretch"
                                        bg={isDark ? "secondary" : "text"}
                                        w="400px" h="75vh" gap={0}
                                    >
                                        <ChatHeader onClose={closeChat} />

                                        <ChatMessages />

                                        <ChatInputBar />
                                    </VStack>
                                </motion.div>
                            </Popover.Content>
                        )}
                    </AnimatePresence>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
	);
};

export default Chat;
