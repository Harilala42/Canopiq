import {
	VStack,
	HStack,
	Text,
	Box,
	Spinner,
	Icon
} from "@chakra-ui/react";
import { useContext, memo, JSX } from "react";
import { ChatMessageContent } from "@/components/chat";
import { useChatMessagesController } from "@/hooks/useChatMessagesController";
import { ThemeContext } from "@/contexts/themeContext";
import { ChatGreeting } from "@/components/chat";
import { LuCircleX } from "react-icons/lu";
import { JobStatus } from "@/types/job";

const PIPELINE_STEPS: Record<
	Exclude<JobStatus, "completed" | "failed" | "canceled">, 
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
		<VStack 
			w="100%"
			align="center" justify="flex-start"
			overflowX="none"
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
					<ChatMessageContent content={msg.content} role={msg.role} isDark={isDark} />
				</VStack>
				))
			)}

			{isLoading && !isThinking && !messages.length && (
				<VStack h="100%" justify="center">
					<Spinner color={isDark ? "text" : "secondary"} />
				</VStack>
			)}

			{!isLoading && !isThinking && !messages.length && <ChatGreeting />}

			{isThinking && (currentStatus !== "failed" && currentStatus !== "canceled") && (
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

			{!isThinking && (currentStatus === "failed" || currentStatus === "canceled") && (
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

					{errMessage && (
						<Text className="text-styles" color={isDark ? "text" : "secondary"} fontSize="xs" wordBreak="break-word">
							{errMessage}
						</Text>
					)}
				</VStack>
			)}

			<Box ref={messagesEndRef} />
		</VStack>
	);
});

export default ChatMessages;
