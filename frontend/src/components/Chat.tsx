import useApi from '@/hooks/useAPI';
import dark from '@/assets/earthDark.svg';
import light from '@/assets/earthLight.svg';
import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useContext, useCallback, useRef, memo, JSX } from 'react';
import { VStack, HStack, Box, Popover, Portal, Text, Textarea, Image, Spinner, Icon } from '@chakra-ui/react';
import { LuBot, LuSend, LuX, LuBotMessageSquare } from 'react-icons/lu';
import { ThemeContext } from '@/contexts/themeContext';
import { AlertContext } from '@/contexts/alertContext';
import { AuthContext } from '@/contexts/authContext';
import { IconButton } from "@/components/IconButton";
import { supabase } from '@/utils/supabase';
import { MessageData } from '@/types/chat';

const ChatHeader = memo(({ onClose }: { onClose: () => void }): JSX.Element => {
    const currentQuery = useChatStore((state) => state.currentQuery);
    const { theme } = useContext(ThemeContext);

    return (
        <Popover.Header 
            w="100%" p={0}
            borderBottom="1px solid" 
            borderColor={theme === "dark" ? "variantDark" : "variantLight"}
        >
            <VStack w="100%" align="flex-start" p={2} gap={1}>
                <HStack  
                    align="center" justify="space-between" w="100%"
                    color={theme === "dark" ? "text" : "secondary"}
                    gap={2}
                >
                    <HStack align="center" justify="center" ml={2} gap={2}>
                        <Icon size="md" aria-label='AI Assistant Icon'>
                            <LuBot />
                        </Icon>

                        <Text className="title-styles" fontWeight="bold" fontSize="md" color={theme === "dark" ? "text" : "secondary"}>
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
                    color={theme === "dark" ? "text" : "secondary"}
                >
                    {currentQuery?.title || "New Chat"}
                </Text>
            </VStack>
        </Popover.Header>
    );
});

const ChatGreeting = memo((): JSX.Element => {
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);

    return (
        <VStack h="100%" align="center" justify="center" gap={5} flex={1}>
            <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
            >
                <Image src={theme !== "dark" ? dark : light} w="150px" alt="Welcome Earth Icon" />
            </motion.div>

            <VStack align="center">
                <Text className="titles-styles" color={theme === "dark" ? "text" : "secondary"} fontSize="sm" fontWeight="bold">
                    Hi {user.username}
                </Text>
                
                <Text className="text-styles" color={theme === "dark" ? "text" : "secondary"} fontSize="md">
                    Where should we start? 
                </Text>
            </VStack>
        </VStack>
    );
});

const ChatMessages = memo((): JSX.Element => {    
    const messages = useMessageStore((state) => state.messages);
    const isLoading = useMessageStore((state) => state.isLoading);
    const isThinking = useMessageStore((state) => state.isThinking);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { theme } = useContext(ThemeContext);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages]);

    return (
        <Popover.Body p={0}>
            <VStack 
                w="100%" h="100%"
                align="center" justify="flex-start"
                overflowY="auto" px={2} py={4}
                gap={4} flex={1}
            >
                {!isLoading && messages.length > 0 && (messages.map((msg) => (
                        <VStack 
                            key={msg.id}
                            align="flex-start"
                            alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                            bg={msg.role === "user" 
                                ? (theme === "dark" ? "primary" : "secondary") 
                                : (theme === "dark" ? "variantDark" : "variantLight")}
                            borderRadius="2xl"
                            borderBottomRightRadius={msg.role === "user" ? "sm" : "2xl"}
                            borderBottomLeftRadius={msg.role === "model" ? "sm" : "2xl"}
                            maxW="75%" p={3}
                        >
                            <Text 
                                className="text-styles" fontSize="md"
                                wordBreak="break-word" whiteSpace="pre-wrap"
                                color={
                                    msg.role !== "user" 
                                    ? (theme === "dark" ? "text" : "secondary")
                                    : "text"
                                }
                            >
                                {msg.content}
                            </Text>
                        </VStack>
                    ))
                )}

                {isLoading && !messages.length && (
                    <VStack h="100%" justify="center">
                        <Spinner color={theme === "dark" ? "text" : "secondary"} />
                    </VStack>
                )}

                {!isLoading && !messages.length && <ChatGreeting />}

                {isThinking && (
                    <HStack 
                        alignSelf="flex-start"
                        bg={theme === "dark" ? "variantDark" : "variantLight"}
                        borderRadius="2xl"
                        borderBottomLeftRadius="sm"
                        p={5} gap={1}
                    >
                        <motion.div
                            style={{ display: 'flex', gap: '5px', alignItems: 'center' }}
                            initial="initial"
                            animate="animate"
                        >
                            {[0, 1, 2].map((index) => (
                                <motion.span
                                    key={index}
                                    variants={{
                                        initial: { y: 0 },
                                        animate: { y: -8 }
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                        ease: "easeInOut",
                                        delay: index * 0.25 
                                    }}
                                    style={{
                                        width: '5px',
                                        height: '5px',
                                        display: 'inline-block',
                                        backgroundColor: theme === "dark" ? "#cecbf6" : "#1a1535",
                                        borderRadius: '50%',
                                    }}
                                />
                            ))}
                        </motion.div>
                    </HStack>
                )}

                <Box ref={messagesEndRef} />
            </VStack>
        </Popover.Body>
    );
});

const ChatInputBar = memo(({ chat_id }: { chat_id: string }): JSX.Element => {
    const isLoading = useMessageStore((state) => state.isLoading);
    const setIsThinking = useMessageStore((state) => state.setIsThinking);
    const addMessage = useMessageStore((state) => state.addMessage);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>('');
    const { showAlert } = useContext(AlertContext);
    const { theme } = useContext(ThemeContext);
    const { execute } = useApi();

    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
        }
    }, [inputValue]);

    const handleSendMessage = useCallback(async () => {
        if (!inputValue.trim()) return;
        setIsSending(true);

        try {
            const newMessage = await execute({
                url: import.meta.env.VITE_API_CHAT_MESSAGE.replace("{chat_id}", chat_id),
                method: "POST",
                body: { message: inputValue }
            });

            if (newMessage && newMessage?.message) {
                addMessage(newMessage.message);
                setIsThinking(true);
                setInputValue('');
            }
        } catch(err: any) {
            console.error("Failed to send message:", err.message);
            showAlert(false, "Failed to send message. Try again later!");
        } finally {
            setIsSending(false);
        }
    }, [chat_id, inputValue]);

    return (
        <Popover.Footer  
            borderTop="1px solid" 
            borderColor={theme === "dark" ? "variantDark" : "variantLight"}
            px={2} py={3}
        >
            <HStack 
                bg={theme === "dark" ? "variantDark" : "variantLight"} 
                borderRadius={15} overflow="hidden"
                w="100%" p={1}
            >
                <Textarea
                    ref={textareaRef}
                    value={inputValue} 
                    placeholder="Ask Canopiq" 
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}

                    className="text-styles" 
                    minH="unset" maxH="100px"
                    resize="none" maxLength={1000}
                    border="none" rows={1} pt={2} pb={2}
                    color={theme === "dark" ? "text" : "secondary"}
                    _placeholder={{ 
                        fontFamily: "FiraCode", 
                        color: theme === "dark" ? "text" : "secondary", 
                        opacity: 0.8
                    }}
                    _focus={{ focusRing: "none" }}
                />

                <IconButton 
                    aria-label="Send Message" 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || isSending}
                    borderRadius="full" size="md"
                >
                    { !isSending ? <LuSend /> : <Spinner color={theme === "dark" ? "text" : "secondary"} /> }
                </IconButton>
            </HStack>
        </Popover.Footer>
    );
});

const Chat = (): JSX.Element => {
    const currentQuery = useChatStore((state) => state.currentQuery);
    const setMessages = useMessageStore((state) => state.setMessages);
    const setIsLoading = useMessageStore((state) => state.setIsLoading);
    const setIsThinking = useMessageStore((state) => state.setIsThinking);
    const addMessage = useMessageStore((state) => state.addMessage);

    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const { showAlert } = useContext(AlertContext);
    const { theme } = useContext(ThemeContext);
    const { execute } = useApi();

    const handleOpen = () => {
        setIsOpen(true);
        setIsVisible(true);
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => setIsOpen(false), 300);
    };

    const retrieceChatMessage = useCallback(async () => {
        setMessages([]);
        setIsLoading(true);

        try {
            const messageList = await execute({
                url: import.meta.env.VITE_API_CHAT_MESSAGE.replace("{chat_id}", currentQuery.id)
            });

            if (messageList && messageList?.messages)
                setMessages(messageList.messages);
        } catch(err: any) {
            console.error("Failed to load chat message:", err.message);
            showAlert(false, "Failed to load chat message. Try again later!");
        } finally {
            setIsLoading(false);
        }
    }, [currentQuery?.id]);

    useEffect(() => {
        if (!currentQuery?.id) return;

        const channel = supabase
            .channel(`messages-${currentQuery.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${currentQuery.id}`
                },
                (payload: any) => {
                    const { id, role, content, created_at } = payload.new;
                    const newMessage: MessageData = { id, role, content, created_at };

                    if (role === 'model') setIsThinking(false);
                    addMessage(newMessage);
                }
            )
            .subscribe();

        retrieceChatMessage();

        return () => { 
            supabase.removeChannel(channel);
        }
    }, [currentQuery?.id]);

    return (
        <Popover.Root open={isOpen} positioning={{ placement: "top-start" }}>
            <Popover.Trigger asChild>
                <IconButton
                    size="xl"
                    position="absolute"
                    bottom="20px" left="20px"
                    zIndex={1000} borderRadius="full"
                    onClick={() => isOpen ? handleClose() : handleOpen()}
                    bg={theme === "dark" ? "secondary" : "text"}
                    aria-label='Bot Message Button'
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
                                        bg={theme === "dark" ? "secondary" : "text"}
                                        w="400px" h="75vh" gap={0}
                                    >
                                        <ChatHeader onClose={handleClose} />

                                        <ChatMessages />

                                        <ChatInputBar chat_id={currentQuery?.id} />
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
