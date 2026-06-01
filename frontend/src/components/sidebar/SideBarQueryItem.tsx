import { ChatData } from "@/types/chat";
import { memo, useContext } from "react";
import { HStack, Text, Box } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";
import { MenuOptions } from "@/components/menu";
import useChatStore from "@/stores/useChatStore";

interface SideBarQueryItemProps
{
    query: ChatData;
    isExpanded: boolean;
    onSelect: (query: ChatData) => void;
}

const SideBarQueryItem = memo(({ 
    query, 
    isExpanded, 
    onSelect
}: SideBarQueryItemProps) => {
    const currentQuery = useChatStore((state) => state.currentQuery);
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    return (
        <HStack
            w="100%"
            align="center"
            justify="space-between"
            display={isExpanded ? "flex" : "none"}
            onClick={() => onSelect(query)}
            borderRadius={10}
            pl={2}
            _disabled={{
                bg: isDark ? "variantDark" : "variantLight",
                cursor: "pointer",
            }}
        >
            <HStack gap={2} justify="space-between" flex="1">
                <Text
                    className="text-styles"
                    color={isDark ? "text" : "secondary"}
                    fontSize="sm"
                >
                    {query.title.length > 30
                        ? query.title.slice(0, 30) + "..."
                        : query.title}
                </Text>

                {query.id === currentQuery?.id && (
                    <Box
                        w="8px" h="8px"
                        borderRadius="full"
                        bg={isDark ? "primary" : "secondary"}
                        flexShrink={0}
                    />
                )}
            </HStack>

            <Box onClick={(e) => e.stopPropagation()}>
                <MenuOptions query={query} />
            </Box>
        </HStack>
    );
});

export default SideBarQueryItem;