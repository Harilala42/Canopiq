import { ThemeContext } from "@/contexts/themeContext";
import { HStack, VStack, Text, Icon, Skeleton, Span } from "@chakra-ui/react";
import { useContext, JSX } from "react";
import { LuInfo } from "react-icons/lu";
import { IconType } from "react-icons";

interface ChartContainerProps
{
    hasData: boolean;
    legend: string;
    unit: string;
    source: string;
    icon: IconType;
    children: React.ReactNode;
}

const ChartContainer = ({ 
    hasData, 
    legend, 
    unit, 
    source, 
    icon: IconComponent, 
    children
}: ChartContainerProps): JSX.Element => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const brandColor = isDark ? "text" : "secondary";

    if (!hasData) {
        return (
            <Skeleton 
                flex={1} w="100%" borderRadius="xl" 
                bg={isDark ? "variantDark" : "variantLight"}
                minH="300px"
            />
        );
    }

    return (
        <VStack
            w="100%" p={5} gap={4} align="flex-start"
            bg={isDark ? "variantDark" : "variantLight"}
            borderRadius="xl"
        >
            {/* Title */}
            <HStack justify="center" w="100%" gap={2}>
                <Icon color={brandColor} size="md">
                    <IconComponent />
                </Icon>
                <Text fontSize="md" fontWeight="bold" color={brandColor}>
                    {`${legend} (${unit})`}
                </Text>
            </HStack>

            {/* Core Visualization Data */}
            {children}

            {/* Source */}
            <HStack justify="center" w="100%" gap={2}>
                <Icon color={brandColor} size="md">
                    <LuInfo />
                </Icon>
                <Text className="text-styles" fontSize="sm" color={brandColor}>
                    <Span fontWeight="semibold" textDecoration="underline">
                        Source:
                    </Span>{" "}
                    {source}
                </Text>
            </HStack>
        </VStack>
    );
};

export default ChartContainer;
