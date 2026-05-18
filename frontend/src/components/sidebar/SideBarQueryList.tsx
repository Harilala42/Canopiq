import { memo, useContext } from "react";
import { VStack, HStack, Box, Spinner, Text } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";
import { SideBarQueryItem } from "@/components/sidebar";
import { IconButton } from "@/components/IconButton";
import { LuSearch } from "react-icons/lu";
import { ChatData } from "@/types/chat";

interface SideBarQueryListProps {
    isExpanded: boolean;
    queries: ChatData[];
    sortedChats: ChatData[];
    isLoading: boolean;
    handleSelectQuery: (query: ChatData) => void;
}

const SideBarQueryList = memo(({
    isExpanded,
    queries,
    sortedChats,
    isLoading,
    handleSelectQuery,
}: SideBarQueryListProps) => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    return (
        <VStack w="100%" align="flex-start" gap={1}>
            <HStack w="100%" align="center" justify={ isExpanded ? "space-between" : "center" }>
                <Text 
                    className="title-styles" 
                    fontSize="md" fontWeight="bold" ml={2}
                    color={ isDark ? "text" : "secondary" }
                    display={isExpanded ? "flex" : "none"} 
                >
                    Your Queries
                </Text>

                <IconButton aria-label="Search queries">
                    <LuSearch />
                </IconButton>
            </HStack>

            {
                queries.length > 0 && sortedChats.map((query) => (
                    <SideBarQueryItem
                        key={query.id}
                        query={query}
                        isExpanded={isExpanded}
                        onSelect={handleSelectQuery}
                    />
                ))
            }

            {isLoading && queries.length === 0 && (
                <Box
                    w="100%"
                    p={4}
                    display={isExpanded ? "flex" : "none"}
                    alignItems="center"
                    justifyContent="center"
                >
                    <Spinner color={isDark ? "text" : "secondary"} size="sm" />
                </Box>
            )}
        </VStack>
    );
});

export default SideBarQueryList;