import { ChatData } from "@/types/chat";
import { memo, useContext } from "react";
import { HStack, Text, Box } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";
import { MenuOptions } from "@/components/menu";

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
            _hover={{
                bg: isDark ? "variantDark" : "variantLight",
                cursor: "pointer",
            }}
        >
            <Text
                className="text-styles"
                color={isDark ? "text" : "secondary"}
                fontSize="sm"
                flex="1"
            >
                {
                    query.title.length > 30
                    ? query.title.slice(0, 30) + "..."
                    : query.title
                }
            </Text>

            <Box onClick={(e) => e.stopPropagation()}>
                <MenuOptions query={query} />
            </Box>
        </HStack>
    );
});

export default SideBarQueryItem;