import logo from '@/assets/logo.svg';
import { ChatData } from '@/types/chat';
import { useState, useEffect, useContext, useCallback, useMemo, memo, JSX } from 'react';
import { VStack, HStack, Box, Image, Text, Menu, Portal, Dialog, Input, Spinner } from '@chakra-ui/react';
import { LuPanelLeft, LuPanelRight, LuCirclePlus, LuEllipsisVertical, LuSearch, LuTrash, LuPin, LuPinOff, LuPencil, LuX } from 'react-icons/lu';
import { AlertContext } from '@/contexts/alertContext';
import { ThemeContext } from '@/contexts/themeContext';
import { IconButton } from '@/components/IconButton';
import { Button } from '@/components/Button';
import { IconType } from 'react-icons';
import useApi from '@/hooks/useAPI';

interface SlideBarProps
{
    isExpanded: boolean;
    onToggle: () => void;
}

interface MenuItemProps
{
    name: string;
    icon: IconType;
    onClick?: () => void;
}

interface ChatDialogProps
{
    query: ChatData,
    isOpen: boolean,
    setQuery: React.Dispatch<React.SetStateAction<ChatData[]>>,
    onClose: () => void
}

const MenuItem = memo(({ icon: Icon, name, onClick }: MenuItemProps): JSX.Element => {
    const { theme } = useContext(ThemeContext);

    return (
        <Menu.Item
            value={name} onClick={onClick}
            _hover={{ 
                bg: theme === "dark" ? "variantDark" : "variantLight",
                cursor: "pointer"
            }}
        >
            <HStack color={theme === "dark" ? "text" : "secondary"}>
                <Icon />

                <Text className="text-styles" color={theme === "dark" ? "text" : "secondary"} textAlign="left">
                    { name }
                </Text>
            </HStack>
        </Menu.Item>
    )
});

const ChatDialog = memo(({ query, setQuery, isOpen, onClose }: ChatDialogProps): JSX.Element => {
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
                url: import.meta.env.VITE_API_LLM_UPDATE_CHAT.replace("{chat_id}", query.id),
                method: "PATCH",
                body: { new_title: newTitle }
            });

            setQuery(prev => prev.map(q => 
                q.id === query.id ? { ...q, title: newTitle } : q
            ));
            showAlert(true, "Query renamed successfully.");
            onClose();
        } catch(err: any) {
            console.error("Failed to update query:", err.message);
            showAlert(false, "Failed to rename the query. Please try again later.");
        } finally {
            setIsSaving(false);
        }
    }, [query, newTitle]);

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

const MenuOptions = memo((
    { query, setQuery }
    : { query: ChatData, setQuery: React.Dispatch<React.SetStateAction<ChatData[]>> }
): JSX.Element => {
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [isPinned, setIsPinned] = useState<boolean>(query.is_pinned);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const { showAlert } = useContext(AlertContext);
    const { theme } = useContext(ThemeContext);
    const { execute } = useApi();

    const deleteQuery = useCallback(async () => {
        try {
            await execute({
                url: import.meta.env.VITE_API_LLM_DELETE_CHAT.replace("{chat_id}", query.id),
                method: "DELETE"
            });

            setQuery(prev => prev.filter(q => q.id !== query.id));
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
                url: import.meta.env.VITE_API_LLM_CHAT_TOGGLE_PIN.replace("{chat_id}", query.id),
                method: "PATCH",
                body: { is_pinned: !isPinned }
            });

            setQuery(prev => {
                return prev.map(q => {
                    return q.id === query.id ? { ...q, is_pinned: !q.is_pinned } : q
                });
            });
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
                        <Menu.Content bg={ theme === "dark" ? "primary" : "text" }>
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

            <ChatDialog 
                isOpen={isUpdating}
                query={query} setQuery={setQuery} 
                onClose={() => setIsUpdating(false)} 
            />
        </>
    );
});

export const SlideBar = (
    { isExpanded, onToggle }: SlideBarProps
): JSX.Element => {
    const [queries, setQueries] = useState<ChatData[]>([]);
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
                url: import.meta.env.VITE_API_LLM_CHAT
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
            const response: any = await execute({
                url: import.meta.env.VITE_API_LLM_CREATE_CHAT,
                method: "POST"
            });

            if (!response || !response.chat) throw new Error("Missing Chats List");
            const newQuery: ChatData = response.chat;

            setQueries(prev => [newQuery, ...prev]);
            showAlert(true, "New query created successfully.");
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
            h="100%" px={2} gap={5}
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
                                    {query.title.length > 25 ? query.title.slice(0, 25) + "..." : query.title}
                                </Text>

                                <Box onClick={(e) => e.stopPropagation()}> 
                                    <MenuOptions query={query} setQuery={setQueries} />
                                </Box>
                            </HStack>
                        )
                    }))
                }

                {
                    !isLoading && queries.length == 0 && (
                        <Box w="100%" p={4}>
                            <Text className="text-styles" color={ theme === "dark" ? "text" : "primary" } textAlign="center">
                                No queries yet
                            </Text>
                        </Box>
                    )
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
