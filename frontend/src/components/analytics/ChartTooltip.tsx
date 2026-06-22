import { ThemeContext } from "@/contexts/themeContext";
import { VStack, Text } from "@chakra-ui/react";
import { useContext, memo, JSX } from "react";
import { TooltipProps } from "recharts";

interface ChartTooltipProps extends TooltipProps
{
    payload?: Array<{payload: any}>;

    unit: string;
    labelKey: string;
    labelValue: string;
}

const ChartTooltip = memo(({
    active,
    payload,
    unit,
    labelKey,
    labelValue
}: ChartTooltipProps): JSX.Element => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    if (!active || !payload?.length) return null;

    const data = payload[0].payload;
    return (
        <VStack
            align="flex-start"
            border="1px solid" borderRadius="md"
            bg={isDark ? "secondary" : "text"}
            borderColor={isDark ? "variantLight" : "variantDark"}
            p={2} gap={1}
        >
            <Text className="title-styles" color={isDark ? "text" : "secondary"} fontSize="xs" fontWeight="bold">
                {data[labelKey]}
            </Text>

            <Text className="text-styles" color={isDark ? "text" : "secondary"} fontSize="xs">
                {data[labelValue]}{unit}
            </Text>
        </VStack>
    );
});

export default ChartTooltip;
