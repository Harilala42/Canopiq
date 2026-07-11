import { memo, useContext } from "react";
import { Menu, Portal } from "@chakra-ui/react";
import {
  LuEllipsisVertical,
  LuPin,
  LuPinOff,
  LuPencil,
  LuTrash,
} from "react-icons/lu";
import { IconButton } from "@/components/IconButton";
import { ThemeContext } from "@/contexts/themeContext";
import { MenuItem, RenameQueryDialog } from "@/components/menu";
import { useMenuOptionsController } from "@/hooks/useMenuOptionsController";
import { ChatData } from "@/types/chat";

interface MenuOptionsProps
{
    query: ChatData;
}

const MenuOptions = memo(({ query }: MenuOptionsProps) => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    const {
        menuOpen,
        setMenuOpen,
        isCanceled,
        setIsCanceled,
        isUpdating,
        setIsUpdating,
        isPinned,
        deleteQuery,
        togglePin,
    } = useMenuOptionsController(query);

    return (<>
        <Menu.Root
            open={menuOpen} 
            onOpenChange={(details) => setMenuOpen(details.open)}
        >
            <Menu.Trigger asChild>
                <IconButton 
                    aria-label="edit query" 
                    bg={menuOpen ? (isDark ? "variantDark" : "variantLight") : "transparent"}
                    onMouseEnter={() => setIsCanceled(true)}
                    onMouseLeave={() => setIsCanceled(false)}
                >
                    { !isPinned || isCanceled || menuOpen ? <LuEllipsisVertical /> : <LuPin /> }
                </IconButton>
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                    <Menu.Content bg={ isDark ? "primary" : "secondary" }>
                        <MenuItem 
                            icon={!isPinned ? LuPin : LuPinOff} 
                            name={!isPinned ? "Pin" : "Pin-off"} 
                            onClick={togglePin}
                        />

                        <MenuItem 
                            icon={LuPencil} 
                            name="Rename" 
                            onClick={() => setIsUpdating(true)}
                        />

                        <MenuItem 
                            icon={LuTrash}
                            name="Delete"
                            onClick={deleteQuery}
                        />
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>

        <RenameQueryDialog 
            query={query}
            isOpen={isUpdating}
            onClose={() => setIsUpdating(false)} 
        />
    </>);
});

export default MenuOptions;