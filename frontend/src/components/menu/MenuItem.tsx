import { useState, memo, useContext } from "react";
import { HStack, Text, Menu, Icon as IconChakra } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";
import { IconType } from "react-icons";

interface MenuItemProps
{
    name: string;
    icon: IconType;
    onClick: () => void;
}

const MenuItem = memo(({ 
    icon: Icon,
    name,
    onClick
}: MenuItemProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    return (
        <Menu.Item
            value={name} onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            _hover={{ 
                bg: isDark ? "variantDark" : "variantLight",
                cursor: "pointer"
            }}
        >
            <HStack gap={2}>
                <IconChakra 
                    color={isDark ? "text" : isHovered ? "secondary" : "text"} 
                    size="sm"
                >
                    <Icon />
                </IconChakra>

                <Text 
                    className="text-styles" textAlign="left"
                    color={isDark ? "text" : isHovered ? "secondary" : "text"}
                >
                    { name }
                </Text>
            </HStack>
        </Menu.Item>
    );
});

export default MenuItem;
