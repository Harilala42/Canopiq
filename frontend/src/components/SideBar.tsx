import useApi from '@/hooks/useAPI';
import logo from '@/assets/logo.svg';
import useChatStore from '@/stores/useChatStore';
import { useState, useEffect, useContext, useCallback, useMemo, memo, JSX } from 'react';
import { VStack, HStack, Box, Image, Text, Menu, Portal, Dialog, Input, Spinner } from '@chakra-ui/react';
import { LuPanelLeft, LuPanelRight, LuCirclePlus, LuEllipsisVertical, LuSearch, LuTrash, LuPin, LuPinOff, LuPencil, LuX } from 'react-icons/lu';
import { AlertContext } from '@/contexts/alertContext';
import { ThemeContext } from '@/contexts/themeContext';
import { IconButton } from '@/components/IconButton';
import { Button } from '@/components/Button';
import { ChatData } from '@/types/chat';
import { IconType } from 'react-icons';

interface SideBarProps
{
    isExpanded: boolean;
    onToggle: () => void;
}

interface MenuItemProps
{
    name: string;
    icon: IconType;
    onClick: () => void;
}

interface ChatDialogProps
{
    query: ChatData,
    isOpen: boolean,
    onClose: () => void
}

const ChatDialog = memo(({ query, isOpen, onClose }: ChatDialogProps): JSX.Element => {
    const updateQueryStore = useChatStore((state) => state.updateQuery);
    const [newTitle, setNewTitle] = useState<string>(query.title);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const { showAlert } = useContext(AlertContext);
    const { theme } = useContext(ThemeContext);
    const { execute } = useApi();

    const renameQuery = useCallback(async () => {
        if (!newTitle.trim()) return;
        setIsSaving(true);

        try {
            await execute({
                url: import.meta.env.VITE_API_CHAT_MESSAGE.replace("{chat_id}", query.id),
                method: "PATCH",
                body: { new_title: newTitle }
            });

            updateQueryStore(query.id, { title: newTitle });
            showAlert(true, "Query renamed successfully.");
            onClose();
        } catch(err: any) {
            console.error("Failed to update query:", err.message);
            showAlert(false, "Failed to rename the query. Please try again later.");
        } finally {
            setIsSaving(false);
        }
    }, [query.id, newTitle]);

    return (
        <Dialog.Root open={isOpen} onOpenChange={(details) => !details.open && onClose()}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content bg={theme === "dark" ? "secondary" : "text"}>
                        <Dialog.Header>
                            <Dialog.Title className="title-styles" color={theme === "dark" ? "text" : "secondary"}>
                                Rename Chat
                            </Dialog.Title>

                            <Dialog.CloseTrigger asChild>
                                <IconButton aria-label="Close Menu Options">
                                    <LuX />
                                </IconButton>
                            </Dialog.CloseTrigger>
                        </Dialog.Header>

                        <Dialog.Body>
                            <Input 
                                value={newTitle} 
                                placeholder="Enter new title..."
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        renameQuery();
                                    }
                                }}

                                className="text-styles"
                                borderRadius="xl" h="50px"
                                color={theme === "dark" ? "text" : "secondary"}
                                bg={theme === "dark" ? "secondary" : "text" } 
                                borderColor={theme === "dark" ? "text" : "secondary"}
                                _placeholder={{ 
                                    fontFamily: "FiraCode", 
                                    color: theme === "dark" ? "text" : "secondary", 
                                    opacity: 0.8
                                }}
                                _hover={{ borderColor: theme === "dark" ? "primary" : "secondary" }}
                                _focus={{ 
                                    focusRing: "none", 
                                    borderColor: theme === "dark" ? "primary" : "secondary"
                                }}
                            />
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Button 
                                w="40%" bg="transparent" 
                                borderRadius={15} border="1px solid" 
                                color={ theme === "dark" ? "text" : "secondary" }
                                borderColor={ theme === "dark" ? "text" : "secondary" }
                                _hover={{ borderColor: theme === "dark" ? "primary" : "secondary" }} 
                                onClick={() => { 
                                    setNewTitle(query.title); 
                                    onClose(); 
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                w="40%" onClick={renameQuery} 
                                disabled={ !newTitle.length || isSaving || newTitle === query.title }
                            >
                                Save
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
});

const MenuItem = memo(({ icon: Icon, name, onClick }: MenuItemProps): JSX.Element => {
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const { theme } = useContext(ThemeContext);

    return (
        <Menu.Item
            value={name} onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            _hover={{ 
                bg: theme === "dark" ? "variantDark" : "variantLight",
                cursor: "pointer"
            }}
        >
            <HStack color={theme === "dark" ? "text" : isHovered ? "secondary" : "text"}>
                <Icon />

                <Text 
                    className="text-styles" textAlign="left"
                    color={theme === "dark" ? "text" : isHovered ? "secondary" : "text"}
                >
                    { name }
                </Text>
            </HStack>
        </Menu.Item>
    )
});

const MenuOptions = memo(({ query }: { query: ChatData } ): JSX.Element => {
    const deleleQueryStore = useChatStore((state) => state.deleteQuery);
    const updateQueryStore = useChatStore((state) => state.updateQuery);

    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [isPinned, setIsPinned] = useState<boolean>(query.is_pinned);
    const { showAlert } = useContext(AlertContext);
    const { theme } = useContext(ThemeContext);
    const { execute } = useApi();

    const deleteQuery = useCallback(async () => {
        try {
            await execute({
                url: import.meta.env.VITE_API_CHAT_MESSAGE.replace("{chat_id}", query.id),
                method: "DELETE"
            });

            deleleQueryStore(query.id);
            showAlert(true, "Query deleted successfully.");
        } catch (err: any) {
            console.error("Failed to delete query:", err.message);
            showAlert(false, "Failed to delete the query. Please try again later.");
        }
    }, [query.id]);

    const togglePin = useCallback(async () => {
        setIsPinned(prev => !prev);

        try {
            await execute({
                url: import.meta.env.VITE_API_CHAT_TOGGLE_PIN.replace("{chat_id}", query.id),
                method: "PATCH",
                body: { is_pinned: !isPinned }
            });

            updateQueryStore(query.id, { is_pinned: !isPinned });
        } catch (err: any) {
            setIsPinned(query.is_pinned);
            console.error("Failed to toggle the query pin:", err.message);
            showAlert(false, "Failed to toggle the query pin. Please try again later.");
        }
    }, [query.id]);

    return (
        <>
            <Menu.Root
                open={menuOpen} 
                onOpenChange={(details) => setMenuOpen(details.open)}
            >
                <Menu.Trigger asChild>
                    <IconButton 
                        aria-label="edit query" 
                        bg={menuOpen ? (theme === "dark" ? "variantDark" : "variantLight") : "transparent"}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        { !isPinned || isHovered || menuOpen ? <LuEllipsisVertical /> : <LuPin /> }
                    </IconButton>
                </Menu.Trigger>
                <Portal>
                    <Menu.Positioner>
                        <Menu.Content bg={ theme === "dark" ? "primary" : "secondary" }>
                            <MenuItem 
                                icon={!isPinned ? LuPin : LuPinOff} 
                                name={!isPinned ? "Pin" : "Pin-off"} 
                                onClick={togglePin}
                            />

                            <MenuItem icon={LuPencil} name="Rename" onClick={() => setIsUpdating(true)} />

                            <MenuItem icon={LuTrash} name="Delete" onClick={deleteQuery} />
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu.Root>

            <ChatDialog query={query} isOpen={isUpdating} onClose={() => setIsUpdating(false)} />
        </>
    );
});

const SideBar = ({ isExpanded, onToggle }: SideBarProps): JSX.Element => {
    const queries = useChatStore((state) => state.queries);
    const setQueries = useChatStore((state) => state.setQueries);
    const setCurrentQuery = useChatStore((state) => state.setCurrentQuery);
    const addQuery = useChatStore((state) => state.addQuery);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const { showAlert } = useContext(AlertContext);
    const { theme } = useContext(ThemeContext);
    const { execute } = useApi();

    const sortedChats = useMemo(() => {
        return [...queries].sort((a, b) => {
            const timeA = Date.parse(a.created_at) || 0;
            const timeB = Date.parse(b.created_at) || 0;

            return Number(b.is_pinned) - Number(a.is_pinned) || timeB - timeA;
        });
    }, [queries]);

    const fetchQueries = useCallback(async () => {
        setIsLoading(true);

        try {
            const myQueries = await execute({
                url: import.meta.env.VITE_API_CHAT
            });

            if (myQueries && myQueries?.chats)
                setQueries(myQueries.chats);
        } catch (err: any) {
            console.error("Failed to fetch queries:", err.message);
            showAlert(false, "Failed to load your queries. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, [execute]);

    const createNewQuery = useCallback(async () => {
        setIsCreating(true);

        try {
            const newQuery: any = await execute({
                url: import.meta.env.VITE_API_CHAT_NEW,
                method: "POST"
            });

            if (newQuery && newQuery.chat) {
                addQuery(newQuery.chat);
                showAlert(true, "New query created successfully.");
            }
        } catch (err: any) {
            console.error("Failed to create new query:", err.message);
            showAlert(false, "Failed to create a new query. Please try again later.");
        } finally {
            setIsCreating(false);
        }
    }, []);

    useEffect(() => {
        fetchQueries();
    }, [execute]);

    return (
        <VStack 
            align="center" 
            justify="flex-start" 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            bg={ theme === "dark" ? "secondary" : "text" } 
            borderRight="1px solid" borderColor={ theme === "dark" ? "variantDark" : "variantLight" }
            minW="50px" w={isExpanded ? "250px" : "50px"}
            onClick={() => !isExpanded && onToggle()}
            h="100%" px={isExpanded ? 2 : 1} gap={5}
        >
            <HStack align="center" justify={ isExpanded ? "space-between" : "center" } h="60px" w="100%">
                {
                    isHovered && !isExpanded
                    ? (
                        <IconButton aria-label="Expand sidebar"> 
                            <LuPanelLeft />
                        </IconButton>
                        )
                    : <Image src={logo} alt="Canopiq logo" boxSize="30px" />
                }

                {isExpanded && (
                    <IconButton 
                        aria-label="Collapse sidebar" 
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                    > 
                        <LuPanelRight />
                    </IconButton>
                )}
            </HStack>

            {
                isExpanded
                ? (
                    <Button aria-label="Create new query" onClick={createNewQuery} disabled={isCreating}>
                        <LuCirclePlus /> New Query
                    </Button>
                )
                : (
                    <IconButton 
                        aria-label="Create new query" 
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            createNewQuery();
                        }}
                        disabled={isCreating}
                    >
                        <LuCirclePlus />
                    </IconButton>
                )
            }

            <VStack w="100%" align="flex-start" justify="center" gap={1}>
                <HStack w="100%" align="center" justify={ isExpanded ? "space-between" : "center" }>
                    <Text 
                        className="title-styles" 
                        fontSize="md" fontWeight="bold" ml={2}
                        color={ theme === "dark" ? "text" : "secondary" }
                        display={isExpanded ? "flex" : "none"} 
                    >
                        Your Queries
                    </Text>

                    <IconButton aria-label="Search queries">
                        <LuSearch />
                    </IconButton>
                </HStack>

                {
                    queries.length > 0 && (sortedChats.map((query: ChatData) => {
                        return (
                            <HStack 
                                key={query.id} w="100%"
                                role="button" aria-label={query.title}
                                align="center" justify="space-between"
                                display={isExpanded ? "flex" : "none"} 
                                onClick={() => setCurrentQuery(query)}
                                borderRadius={15} pl={2}
                                _hover={{ 
                                    bg: theme === "dark" ? "variantDark" : "variantLight", 
                                    cursor: "pointer" 
                                }}
                            >
                                <Text 
                                    key={query.id} 
                                    className="text-styles"
                                    color={ theme === "dark" ? "text" : "secondary" } 
                                    fontSize="sm" flex="1"
                                >
                                    {query.title.length > 30 ? query.title.slice(0, 30) + "..." : query.title}
                                </Text>

                                <Box onClick={(e) => e.stopPropagation()}> 
                                    <MenuOptions query={query} />
                                </Box>
                            </HStack>
                        )
                    }))
                }

                {
                    isLoading && queries.length == 0 && (
                        <Box 
                            w="100%" p={4}
                            display={isExpanded ? "flex" : "none"} 
                            alignItems="center" 
                            justifyContent="center"
                        >
                            <Spinner color={theme === "dark" ? "text" : "secondary"} size="sm"/>
                        </Box>
                    )
                }
            </VStack>
        </VStack>
    )
};

export default SideBar;
