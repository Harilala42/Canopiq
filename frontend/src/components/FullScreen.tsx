import { useContext, JSX } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";

export const FullScreen = ({ children, ...props }: FlexProps): JSX.Element => {
    const { theme } = useContext(ThemeContext);

    return (
        <Flex
            w="100vw" minW="100vw"
            h="100vh" minH="100vh"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            overflow="hidden"
            bg={theme === "dark" ? "secondary" : "text"}
            {...props}
        >
            {children}
        </Flex>
    );
};
