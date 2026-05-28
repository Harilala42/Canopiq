import { LuX } from "react-icons/lu";
import { memo, useContext } from "react";
import { useRenameQueryDialogController } from "@/hooks/useRenameQueryDialogController";
import { Dialog, Portal, Input } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";
import { IconButton } from "@/components/IconButton";
import { Button } from "@/components/Button";
import { ChatData } from "@/types/chat";

interface RenameQueryDialogProps
{
    query: ChatData;
    isOpen: boolean;
    onClose: () => void;
}

const RenameQueryDialog = memo(({ 
    query,
    isOpen, 
    onClose
}: RenameQueryDialogProps) => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    const {
        newTitle,
        setNewTitle,
        renameQuery,
        handleCancel,
        isSaveDisabled,
    } = useRenameQueryDialogController(query, onClose);

    return (
        <Dialog.Root open={isOpen} onOpenChange={(details) => !details.open && onClose()}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content bg={isDark ? "secondary" : "text"}>
                        <Dialog.Header>
                            <Dialog.Title className="title-styles" color={isDark ? "text" : "secondary"}>
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
                                color={isDark ? "text" : "secondary"}
                                bg={isDark ? "secondary" : "text" } 
                                borderColor={isDark ? "text" : "secondary"}
                                _placeholder={{ 
                                    fontFamily: "FiraCode", 
                                    color: isDark ? "text" : "secondary", 
                                    opacity: 0.8
                                }}
                                _Canceled={{ borderColor: isDark ? "primary" : "secondary" }}
                                _focus={{ 
                                    focusRing: "none", 
                                    borderColor: isDark ? "primary" : "secondary"
                                }}
                            />
                        </Dialog.Body>

                        <Dialog.Footer>
                            <Button 
                                w="40%" bg="transparent" 
                                borderRadius={15} border="1px solid" 
                                color={ isDark ? "text" : "secondary" }
                                borderColor={ isDark ? "text" : "secondary" }
                                _Canceled={{ borderColor: isDark ? "primary" : "secondary" }} 
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                            <Button w="40%" onClick={renameQuery} disabled={isSaveDisabled}>
                                Save
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
});

export default RenameQueryDialog;