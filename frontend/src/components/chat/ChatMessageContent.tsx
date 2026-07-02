import remarkGfm from "remark-gfm";
import { useMemo, memo, JSX } from "react";
import ReactMarkdown from "react-markdown";
import { Heading, Text, Box, Table } from "@chakra-ui/react";
import { ChartBar, ChartDonut } from "@/components/analytics";

interface ChatMessageContentProps
{
    content: string;
    role: string;
    isDark: boolean;
}

const ChatMessageContent = memo(({ content, role, isDark }: ChatMessageContentProps): JSX.Element => {
    const isUser = role === "user";
    const textColor = !isUser ? (isDark ? "text" : "secondary") : "text";
    const tableBorderColor = isDark ? "variantLight" : "variantDark";

    const markdownComponents = useMemo(() => ({
        h1: ({ children }: any) => (
            <Heading as="h1" className="titles-styles" size="xl" textDecoration="underline" color={textColor}>
                {children}
            </Heading>
        ),
        h2: ({ children }: any) => (
            <Heading as="h2" className="titles-styles" size="lg" textDecoration="underline" color={textColor}>
                {children}
            </Heading>
        ),
        h3: ({ children }: any) => (
            <Heading as="h3" className="titles-styles" size="md" textDecoration="underline" color={textColor}>
                {children}
            </Heading>
        ),
        p: ({ children }: any) => (
            <Text className="text-styles" fontSize="md" wordBreak="break-word" whiteSpace="pre-wrap" color={textColor}>
                {children}
            </Text>
        ),
        ul: ({ children }: any) => (
            <Box as="ul" pl={5} mt={2} mb={2} style={{ listStyleType: "disc" }}>
                {children}
            </Box>
        ),
        li: ({ children }: any) => (
            <Box as="li" mb={1}>
                <Text className="text-styles" fontSize="md" wordBreak="break-word" whiteSpace="pre-wrap">
                    {children}
                </Text>
            </Box>
        ),
        table: ({ children }: any) => (
            <Box overflowX="auto" borderLeft="1px solid" borderRight="1px solid" borderColor={tableBorderColor} my={4} w="100%">
                <Table.Root variant="line" size="sm">
                    {children}
                </Table.Root>
            </Box>
        ),
        thead: ({ children }: any) => (
            <Table.Header bg={tableBorderColor}>
                {children}
            </Table.Header>
        ),
        th: ({ children }: any) => (
            <Table.ColumnHeader className="text-styles" color={isDark ? "secondary" : "text"} borderColor={tableBorderColor} py={3} px={4} textAlign="left">
                {children}
            </Table.ColumnHeader>
        ),
        td: ({ children }: any) => (
            <Table.Cell className="text-styles" color={textColor} borderColor={tableBorderColor} py={3} px={4}>
                {children}
            </Table.Cell>
        ),
        pre: ({ children }: any) => (
            <Box w="100%" display="block" my={2}>
                {children}
            </Box>
        ),
        code: ({ className, children }: any) => {
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
    }), [textColor, tableBorderColor, isDark]);

    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
        </ReactMarkdown>
    );
});

export default ChatMessageContent;
