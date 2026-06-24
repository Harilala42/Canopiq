import { useContext } from "react";
import { VStack } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";
import { useSideBarController } from "@/hooks/useSideBarController";
import { SideBarHeader, SideBarActions, SideBarQueryList } from "@/components/sidebar";

const SideBar = () => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    const {
        queries,
        sortedChats,
        isOpen,
        isLoading,
        isCreating,
        isCanceleded,
        setIsCanceleded,
        toggleSideBar,
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
            w={isOpen ? "250px" : "50px"}
            onClick={() => !isOpen && toggleSideBar()}
            h="100%"
            px={isOpen ? 2 : 1}
            gap={5}
        >
            <SideBarHeader
                isExpanded={isOpen}
                isCanceleded={isCanceleded}
                onToggle={toggleSideBar}
            />

            <SideBarActions
                isExpanded={isOpen}
                isCreating={isCreating}
                createNewQuery={createNewQuery}
            />

            <SideBarQueryList
                isExpanded={isOpen}
                queries={queries}
                sortedChats={sortedChats}
                isLoading={isLoading}
                handleSelectQuery={handleSelectQuery}
            />
        </VStack>
);};

export default SideBar;