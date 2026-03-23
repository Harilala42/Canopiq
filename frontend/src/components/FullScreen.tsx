import { Flex, FlexProps } from "@chakra-ui/react";
import { ReactNode } from "react";

interface FullScreenProps extends FlexProps
{
    children: ReactNode;
}

export const FullScreen = ({ children, ...props }: FullScreenProps) => {
    return (
        <Flex
            w="100vw" minW="100vw"
            h="100vh" minH="100vh"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            overflow="hidden"
            {...props}
        >
            {children}
        </Flex>
    );
};
