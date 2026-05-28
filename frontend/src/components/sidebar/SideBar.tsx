import { useContext } from "react";
import { VStack } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";
import { useSideBarController } from "@/hooks/useSideBarController";
import { SideBarHeader, SideBarActions, SideBarQueryList } from "@/components/sidebar";

interface SideBarProps
{
    isExpanded: boolean;
    onToggle: () => void;
}

const SideBar = ({ isExpanded, onToggle }: SideBarProps) => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    const {
        queries,
        sortedChats,
        isLoading,
        isCreating,
        isCanceleded,
        setIsCanceleded,
        createNewQuery,
        handleSelectQuery,
    } = useSideBarController();

    return (
        <VStack
            align="center"
            justify="flex-start"
            onMouseEnter={() => setIsCanceleded(true)}
            onMouseLeave={() => setIsCanceleded(false)}
            bg={isDark ? "secondary" : "text"}
            borderRight="1px solid"
            borderColor={isDark ? "variantDark" : "variantLight"}
            minW="50px"
            w={isExpanded ? "250px" : "50px"}
            onClick={() => !isExpanded && onToggle()}
            h="100%"
            px={isExpanded ? 2 : 1}
            gap={5}
        >
            <SideBarHeader
                isExpanded={isExpanded}
                isCanceleded={isCanceleded}
                onToggle={onToggle}
            />

            <SideBarActions
                isExpanded={isExpanded}
                isCreating={isCreating}
                createNewQuery={createNewQuery}
            />

            <SideBarQueryList
                isExpanded={isExpanded}
                queries={queries}
                sortedChats={sortedChats}
                isLoading={isLoading}
                handleSelectQuery={handleSelectQuery}
            />
        </VStack>
);};

export default SideBar;