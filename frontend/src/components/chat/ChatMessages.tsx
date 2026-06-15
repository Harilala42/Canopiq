import {
	VStack,
	HStack,
	Text,
	Popover,
	Box,
	Spinner,
	Icon
} from "@chakra-ui/react";
import ReactMarkdown from 'react-markdown';
import { useContext, memo, JSX } from "react";
import { useChatMessagesController } from "@/hooks/useChatMessagesController";
import { ThemeContext } from "@/contexts/themeContext";
import { ChatGreeting } from "@/components/chat";
import { JobStatus } from "@/types/chat";
import { LuCircleX } from "react-icons/lu";

const PIPELINE_STEPS: Record<
	Exclude<JobStatus, "completed">, 
	{ label: string; desc: string }
> = {
    queued: { 
        label: 'Job in queue', 
        desc: 'Waiting for worker...' 
    },
    analyzing_prompt: { 
        label: 'AI Analysis', 
        desc: 'Gemini is parsing geographic intent...' 
    },
    computing_gee: { 
        label: 'Satellite Analytics', 
        desc: 'Computing Google Earth Engine biomass data...' 
    },
    generating_report: { 
        label: 'Report Compilation', 
        desc: 'Writing final environmental brief...' 
    },
	failed: {
        label: 'Job Failed',
        desc: 'Something went wrong processing this request.'
    }
};

const ChatMessages = memo((): JSX.Element => {
	const { 
        messages, 
        isLoading, 
        isThinking, 
        currentStatus, 
        errMessage,
		messagesEndRef
    } = useChatMessagesController();

	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	return (
		<Popover.Body overflow="hidden" p={0}>
			<VStack 
				w="100%" h="100%"
				align="center" justify="flex-start"
				overflowY="auto" p={4}
				gap={5} flex={1}
			>
				{!isLoading && messages.length > 0 && (messages.map((msg) => (
					<VStack 
						key={msg.id}
						align="flex-start"
						alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
						bg={msg.role === "user" 
							? (isDark ? "primary" : "secondary") 
							: "transparent"}
						borderRadius="2xl"
						borderBottomRightRadius="sm"
						maxW={msg.role === "user" ? "90%" : "100%"} 
						p={msg.role === "user" ? 3 : 0}
					>
						<ReactMarkdown
							components={{
								p: ({ children }) => (
									<Text 
										className="text-styles" fontSize="md"
										wordBreak="break-word" whiteSpace="pre-wrap"
										color={ 
											msg.role !== "user" 
											? (isDark ? "text" : "secondary") 
											: "text"
										}  
									>
										{children}
									</Text>
								),
								ul: ({ children }) => (
									<Box as="ul"
										pl={5} mt={2} mb={2}
										style={{ listStyleType: "disc" }}
									>
										{children}
									</Box>
								),
								li: ({ children }) => (
									<Box as="li" mb={1}>
										<Text
											className="text-styles" fontSize="md"
											wordBreak="break-word" whiteSpace="pre-wrap"
										>
											{children}
										</Text>
									</Box>
								)
							}}
						>
							{msg.content}
						</ReactMarkdown>
					</VStack>
					))
				)}

				{isLoading && !messages.length && (
					<VStack h="100%" justify="center">
						<Spinner color={isDark ? "text" : "secondary"} />
					</VStack>
				)}

				{!isLoading && !messages.length && <ChatGreeting />}

				{isThinking && currentStatus !== "failed" && (
					<HStack alignSelf="flex-start" pl={2} gap={4}>
						<Spinner
							color={ isDark ? "primary" : "secondary" } 
							animationDuration="0.5s" 
							borderWidth="5px" size="sm"
						/>

						<Text
							className="text-styles"
							fontSize="sm" opacity={0.7}
							color={isDark ? "text" : "secondary"}
						>
							{PIPELINE_STEPS[currentStatus]?.desc}
						</Text>
					</HStack>
				)}

				{currentStatus === "failed" && (
					<VStack 
						alignSelf="flex-start" 
						align="flex-start"
						bg="error" 
						_dark={{ bg: "orange.800/20" }}
						borderLeft="4px solid"
						borderColor="error"
						borderRadius="md"
						w="100%" p={4} 
						gap={2}
					>
						<HStack gap={2}>
							<Icon color="error" size="sm">
								<LuCircleX />
							</Icon>

							<Text 
								className="titles-styles" 
								fontWeight="bold" fontSize="sm"
								color="error"
							>
								Analysis Canceled
							</Text>
						</HStack>

						<Text 
							className="text-styles" 
							color={isDark ? "text" : "secondary"}
							fontSize="xs" wordBreak="break-word"
						>
							{errMessage || "An unexpected worker error occurred while processing the query"}
						</Text>
					</VStack>
				)}

				<Box ref={messagesEndRef} />
			</VStack>
		</Popover.Body>
	);
});

export default ChatMessages;
