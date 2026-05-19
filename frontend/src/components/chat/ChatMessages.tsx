import {
	memo,
	JSX,
	useContext,
	useEffect,
	useRef
} from "react";
import {
	VStack,
	HStack,
	Text,
	Popover,
	Box,
	Spinner
} from "@chakra-ui/react";
import useMessageStore from "@/stores/useMessageStore";
import { ThemeContext } from "@/contexts/themeContext";
import { ChatGreeting } from "@/components/chat";
import { motion } from "framer-motion";

const formatTime = (isoString: string) => {
    const date = new Date(isoString);

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
};

const ChatMessages = memo((): JSX.Element => {
	const messages = useMessageStore((state) => state.messages);
	const isLoading = useMessageStore((state) => state.isLoading);
	const isThinking = useMessageStore((state) => state.isThinking);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({
			behavior: "smooth"
		});
	}, [messages]);

	return (
		<Popover.Body overflow="hidden" p={0}>
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
							maxW="90%" px={1}
						>
							<Box
								bg={msg.role === "user" 
									? (isDark ? "primary" : "secondary") 
									: (isDark ? "variantDark" : "variantLight")}
								borderRadius="2xl"
								borderBottomRightRadius={msg.role === "user" ? "sm" : "2xl"}
								borderBottomLeftRadius={msg.role === "model" ? "sm" : "2xl"}
								p={3}
							>
								<Text 
									className="text-styles" fontSize="md"
									wordBreak="break-word" whiteSpace="pre-wrap"
									color={
										msg.role !== "user" 
										? (isDark ? "text" : "secondary")
										: "text"
									}
								>
									{msg.content}
								</Text>
							</Box>

							<Box w="100%">
								<Text
									className="text-styles"
									fontSize="sm" opacity={0.7}
									color={isDark ? "text" : "secondary"}
									textAlign={msg.role === "user" ? "right" : "left"}
								>
									{msg.role === "user"
										? formatTime(msg.created_at)
										: `${formatTime(msg.created_at)} - Gemini 3.1`}
								</Text>
							</Box>
						</VStack>
					))
				)}

				{isLoading && !messages.length && (
					<VStack h="100%" justify="center">
						<Spinner color={isDark ? "text" : "secondary"} />
					</VStack>
				)}

				{!isLoading && !messages.length && <ChatGreeting />}

				{isThinking && (
					<HStack 
						alignSelf="flex-start"
						bg={isDark ? "variantDark" : "variantLight"}
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
										backgroundColor: isDark ? "#cecbf6" : "#1a1535",
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

export default ChatMessages;
