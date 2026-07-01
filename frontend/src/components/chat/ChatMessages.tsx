import {
	VStack,
	HStack,
	Text,
	Heading,
	Box,
	Spinner,
	Icon,
	Table
} from "@chakra-ui/react";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import { useContext, memo, JSX } from "react";
import { ChartBar, ChartDonut } from "@/components/analytics";
import { useChatMessagesController } from "@/hooks/useChatMessagesController";
import { ThemeContext } from "@/contexts/themeContext";
import { ChatGreeting } from "@/components/chat";
import { LuCircleX } from "react-icons/lu";
import { JobStatus } from "@/types/chat";

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
					<ReactMarkdown
						remarkPlugins={[remarkGfm]}
						components={{
							h1: ({ children }) => (
								<Heading 
									as="h1" 
									className="titles-styles" size="xl"
									color={msg.role !== "user" ? (isDark ? "text" : "secondary") : "text"}
									textDecoration="underline"
								>
									{children}
								</Heading>
							),
							h2: ({ children }) => (
								<Heading 
									as="h2"
									className="titles-styles" size="lg" 
									color={msg.role !== "user" ? (isDark ? "text" : "secondary") : "text"}
									textDecoration="underline"
								>
									{children}
								</Heading>
							),
							h3: ({ children }) => (
								<Heading 
									as="h3"
									className="titles-styles" size="md" 
									color={msg.role !== "user" ? (isDark ? "text" : "secondary") : "text"}
									textDecoration="underline"
								>
									{children}
								</Heading>
							),
							p: ({ children }) => (
								<Text 
									className="text-styles" fontSize="md"
									wordBreak="break-word" whiteSpace="pre-wrap"
									color={msg.role !== "user" ? (isDark ? "text" : "secondary") : "text"}  
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
							),
							table: ({ children }) => (
								<Box 
									overflowX="auto" 
									borderLeft="1px solid" borderRight="1px solid" 
									borderColor={isDark ? "variantLight" : "variantDark" }
									my={4} w="100%"
								>
									<Table.Root variant="line" size="sm">
										{children}
									</Table.Root>
								</Box>
							),
							thead: ({ children }) => (
								<Table.Header bg={isDark ? "variantLight" : "variantDark" }>
									{children}
								</Table.Header>
							),
							th: ({ children }) => (
								<Table.ColumnHeader 
									className="text-styles"
									color={isDark ? "secondary" : "text"} 
									borderColor={isDark ? "variantLight" : "variantDark" }
									py={3}
									px={4}
									textAlign="left"
								>
									{children}
								</Table.ColumnHeader>
							),
							td: ({ children }) => (
								<Table.Cell 
									className="text-styles"
									color={msg.role !== "user" ? (isDark ? "text" : "secondary") : "text"}
									borderColor={isDark ? "variantLight" : "variantDark" }
									py={3}
									px={4}
								>
									{children}
								</Table.Cell>
							),
							pre: ({ children }) => (
								<Box w="100%" display="block" my={2}>
									{children}
								</Box>
							),
							code: ({ className, children }) => {
								const raw = String(children).trim();

								if (className === "language-biomass_trends") {
									const { geo_analysis_id } = JSON.parse(raw);
									return <ChartBar analysisId={geo_analysis_id} />;
								}

								if (className === "language-land_use_distribution") {
									const { geo_analysis_id } = JSON.parse(raw);
									return <ChartDonut analysisId={geo_analysis_id} />;
								}

								return <code className={className}>{children}</code>;
							}
						}}
					>
						{msg.content}
					</ReactMarkdown>
				</VStack>
				))
			)}

			{isLoading && !isThinking && !messages.length && (
				<VStack h="100%" justify="center">
					<Spinner color={isDark ? "text" : "secondary"} />
				</VStack>
			)}

			{!isLoading && !isThinking && !messages.length && <ChatGreeting />}

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

			{!isThinking && currentStatus === "failed" && (
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
	);
});

export default ChatMessages;
