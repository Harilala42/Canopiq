import useApi from '@/hooks/useAPI';
import useChatStore from '@/stores/useChatStore';
import { useState, useEffect, useContext, useCallback, useRef, JSX } from 'react';
import { VStack, HStack, Box, Text, Input, Spinner } from '@chakra-ui/react';
import { ThemeContext } from '@/contexts/themeContext';
import { AlertContext } from '@/contexts/alertContext';
import { IconButton } from "@/components/IconButton";
import { LuBot, LuSend } from 'react-icons/lu';
import { supabase } from '@/utils/supabase';
import { MessageData } from '@/types/chat';

export const Chat = (): JSX.Element => {
    const { currentQuery } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isThinking, setIsThinking] = useState<boolean>(false);
    const [messages, setMessages] = useState<MessageData[]>([]);
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

    const handleSendMessage = useCallback(async () => {
        if (!inputValue.trim()) return;
        setIsSending(true);

        try {
            const newMessage = await execute({
                url: import.meta.env.VITE_API_LLM_MESSAGE_CHAT.replace("{chat_id}", currentQuery.id),
                method: "POST",
                body: { message: inputValue }
            });

            if (newMessage && newMessage?.message) {
                setMessages((prev) => [...prev, newMessage?.message]);
                setIsThinking(true);
                setInputValue('');
            }
        } catch(err: any) {
            console.error("Failed to send message:", err.message);
            showAlert(false, "Failed to send message. Try again later!");
        } finally {
            setIsSending(false);
        }
    }, [currentQuery?.id, inputValue]);

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
    
                    setMessages((prev) => {
                        const isDuplicate: boolean = prev.some((msg) => msg.id === id);
                        if (isDuplicate) { return prev };
                        
                        return [...prev, newMessage];
                    });
                }
            )
            .subscribe();

        retrieceChatMessage();

        return () => { 
            supabase.removeChannel(channel);
        }
    }, [currentQuery?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages]);

    return (
        <VStack 
            align="stretch"
            bg={ theme === "dark" ? "secondary" : "text" } 
            borderLeft="1px solid" borderColor={ theme === "dark" ? "variantDark" : "variantLight" }
            w="100%" h="100%" maxH="calc(100vh - 60px)" gap={0}
        >
            {/* Header Area */}
            <VStack 
                w="100%" minH="60px" p={2} 
                borderBottom="1px solid" borderColor={theme === "dark" ? "variantDark" : "variantLight"}
                align="flex-start" justify="center"
            >
                <HStack color={theme === "dark" ? "text" : "secondary"} gap={2}>
                    <LuBot size="24px" />

                    <Text className="title-styles" fontWeight="bold" fontSize="md" color={theme === "dark" ? "text" : "secondary"}>
                        Ask Assistant
                    </Text>
                </HStack>
            
                {currentQuery && (
                    <Text className="text-styles" fontSize="sm" opacity={0.7} color={theme === "dark" ? "text" : "secondary"}>
                        {currentQuery.title}
                    </Text>
                )}
            </VStack>

            {!currentQuery && (
                <VStack h="100%" justify="center">
                    <Text className="text-styles" color={ theme === "dark" ? "text" : "primary" } textAlign="center">
                        Select a query to start chatting
                    </Text>
                </VStack>
            )}

            {currentQuery && (<>
                {/* Message Conversation Area */}
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

                    {!isLoading && !messages.length && (
                        <VStack h="100%" justify="center">
                            <Text className="text-styles" color={ theme === "dark" ? "text" : "primary" } textAlign="center">
                                No message sent yet
                            </Text>
                        </VStack>
                    )}

                    {isThinking && (
                        <HStack 
                            alignSelf="flex-start"
                            bg={theme === "dark" ? "variantDark" : "variantLight"}
                            borderRadius="2xl" borderBottomLeftRadius="sm"
                            p={4} gap={1}
                        >
                            <Text className='text-styles' color={theme === "dark" ? "text" : "secondary"} fontSize="md" fontWeight="bold">
                                <style>
                                    {`
                                        @keyframes bounce {
                                            0%, 80%, 100% { transform: translateY(0); }
                                            40% { transform: translateY(-10px); }
                                        }
                                        .dot {
                                            display: inline-block;
                                            animation: bounce 1.5s infinite ease-in-out;
                                        }
                                        .dot:nth-child(1) { animation-delay: -0.2s; }
                                        .dot:nth-child(2) { animation-delay: -0.4s; }
                                    `}
                                </style>
                                <span className="dot">.</span>
                                <span className="dot">.</span>
                                <span className="dot">.</span>
                            </Text>
                        </HStack>
                    )}

                    <Box ref={messagesEndRef} />
                </VStack>

                {/* Message Input Bar */}
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
                            value={inputValue} placeholder="Write your message..." 
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
            </>)}
        </VStack>
    );
};
