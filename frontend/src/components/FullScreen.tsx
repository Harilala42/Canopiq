import { useState, useEffect, useContext, JSX, ReactNode } from "react";
import { Box, Flex, FlexProps, useBreakpointValue } from "@chakra-ui/react";
import { LuMousePointer2, LuMousePointerBan, LuPointer } from "react-icons/lu";
import { ThemeContext } from "@/contexts/themeContext";

interface FullScreenProps extends FlexProps
{
    children: ReactNode;
}

type CursorType = "default" | "pointer" | "disabled";

export const FullScreen = ({ children, ...props }: FullScreenProps): JSX.Element => {
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [cursorType, setCursorType] = useState<CursorType>("default");
    const [isInside, setIsInside] = useState<boolean>(false);
    const { theme } = useContext(ThemeContext);

    const isOnMobile = useBreakpointValue({ base: true, md: false });
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
        }

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            const el = target.closest(
                "button, a, input, textarea, [role='button']"
            ) as HTMLElement | null;
            if (!el) return setCursorType("default");

            const isDisabled = (el as HTMLButtonElement).disabled;
            if (isDisabled) return setCursorType("disabled");
            
            setCursorType("pointer");
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseover", handleMouseOver);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseover", handleMouseOver)
        }
    }, []);

    return (
        <Flex
            cursor={isInside || isOnMobile ? "none" : "default"}
            onMouseEnter={() => setIsInside(true)}
            onMouseLeave={() => setIsInside(false)}
            w="100vw" minW="100vw"
            h="100vh" minH="100vh"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            overflow="hidden"
            bg={theme === "dark" ? "secondary" : "primary"}
            {...props}
        >
            {children}

            {(!isOnMobile && isInside) && (<Box
                position="fixed"
                top={0} left={0}
                transform={`translate(${mousePosition.x}px, ${mousePosition.y}px)`}
                pointerEvents="none"
                zIndex={9999}
            >
                {cursorType === "default" && (
                    <LuMousePointer2 size={24} color="white" />
                )}

                {cursorType === "pointer" && (
                    <LuPointer size={24} color="white" />
                )}

                {cursorType === "disabled" && (
                    <LuMousePointerBan size={24} color="white" />
                )}
            </Box>)}
        </Flex>
    );
};
