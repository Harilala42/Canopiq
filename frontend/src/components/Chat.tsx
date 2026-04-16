import useApi from '@/hooks/useAPI';
import dark from '@/assets/earthDark.svg';
import light from '@/assets/earthLight.svg';
import useChatStore from '@/stores/useChatStore';
import useMessageStore from '@/stores/useMessageStore';
import { useState, useEffect, useContext, useCallback, useRef, memo, JSX } from 'react';
import { VStack, HStack, Box, Text, Input, Image, Spinner } from '@chakra-ui/react';
import { ThemeContext } from '@/contexts/themeContext';
import { AlertContext } from '@/contexts/alertContext';
import { AuthContext } from '@/contexts/authContext';
import { IconButton } from "@/components/IconButton";
import { LuBot, LuSend } from 'react-icons/lu';
import { supabase } from '@/utils/supabase';
import { MessageData } from '@/types/chat';
import { motion } from 'framer-motion';

const ChatHeader = memo(({ title }: { title: string }): JSX.Element => {
    const { theme } = useContext(ThemeContext);

    return (
        <VStack 
            w="100%" minH="60px" p={2} 
            borderBottom="1px solid" borderColor={theme === "dark" ? "variantDark" : "variantLight"}
            align="flex-start" justify="center"
        >
            <HStack color={theme === "dark" ? "text" : "secondary"} gap={2}>
                <LuBot size="24px" />

                <Text className="title-styles" fontWeight="bold" fontSize="md" color={theme === "dark" ? "text" : "secondary"}>
                    AI Assistant
                </Text>
            </HStack>
        
            <Text className="text-styles" fontSize="sm" opacity={0.7} color={theme === "dark" ? "text" : "secondary"}>
                {title}
            </Text>
        </VStack>
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
        <VStack flex={1} overflowY="auto" px={2} py={4} gap={4}>
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

                        <Text 
                            className="text-styles"
                            fontSize="2xs" opacity={0.6}
                            alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                            color={msg.role !== "user" ? (theme === "dark" ? "text" : "secondary") : "text"}
                        >
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
    );
});

const ChatInputBar = memo(({ chat_id }: { chat_id: string }): JSX.Element => {
    const isLoading = useMessageStore((state) => state.isLoading);
    const setIsThinking = useMessageStore((state) => state.setIsThinking);
    const addMessage = useMessageStore((state) => state.addMessage);

    const [isSending, setIsSending] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>('');
    const { showAlert } = useContext(AlertContext);
    const { theme } = useContext(ThemeContext);
    const { execute } = useApi();

    const handleSendMessage = useCallback(async () => {
        if (!inputValue.trim()) return;
        setIsSending(true);

        try {
            const newMessage = await execute({
                url: import.meta.env.VITE_API_LLM_MESSAGE_CHAT.replace("{chat_id}", chat_id),
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
        <Box  
            borderTop="1px solid" 
            borderColor={theme === "dark" ? "variantDark" : "variantLight"}
            w="100%" py={4} px={2}
        >
            <HStack 
                bg={theme === "dark" ? "variantDark" : "variantLight"} 
                borderRadius="full" p={1}
            >
                <Input
                    className="text-styles"
                    value={inputValue} placeholder="Ask Canopiq" 
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}

                    border="none" px={4} py={2}
                    color={theme === "dark" ? "text" : "secondary"}
                    _placeholder={{ 
                        fontFamily: "FiraCode", 
                        color: theme === "dark" ? "text" : "secondary", 
                        opacity: 0.8
                    }}
                    _hover={{ borderColor: theme === "dark" ? "primary" : "secondary" }}
                    _focus={{ focusRing: "none" }}
                />

                <IconButton 
                    aria-label="Send Message" 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || isSending}
                    borderRadius="full"
                >
                    { !isSending ? <LuSend /> : <Spinner color={theme === "dark" ? "text" : "secondary"} /> }
                </IconButton>
            </HStack>
        </Box>
    );
});

const Chat = (): JSX.Element => {
    const currentQuery = useChatStore((state) => state.currentQuery);
    const setMessages = useMessageStore((state) => state.setMessages);
    const setIsLoading = useMessageStore((state) => state.setIsLoading);
    const setIsThinking = useMessageStore((state) => state.setIsThinking);
    const addMessage = useMessageStore((state) => state.addMessage);

    const { showAlert } = useContext(AlertContext);
    const { theme } = useContext(ThemeContext);
    const { execute } = useApi();

    const retrieceChatMessage = useCallback(async () => {
        setMessages([]);
        setIsLoading(true);

        try {
            const messageList = await execute({
                url: import.meta.env.VITE_API_LLM_MESSAGE_CHAT.replace("{chat_id}", currentQuery.id)
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
        <VStack 
            align="stretch"
            bg={ theme === "dark" ? "secondary" : "text" } 
            borderLeft="1px solid" borderColor={ theme === "dark" ? "variantDark" : "variantLight" }
            w="100%" h="100%" maxH="calc(100vh - 60px)" gap={0}
        >
            {/* Header Area */}
            <ChatHeader title={currentQuery?.title} />

            {/* Message Conversation Area */}
            <ChatMessages />

            {/* Message Input Bar */}
            <ChatInputBar chat_id={currentQuery?.id} />
        </VStack>
    );
};

export default Chat;
