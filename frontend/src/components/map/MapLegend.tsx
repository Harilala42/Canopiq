import useAnalyticsStore from "@/stores/useAnalyticsStore";
import { Box, HStack, VStack, Text } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";
import { memo, JSX, useContext } from "react";
import { LegendData } from "@/types/map";

interface MapLegendProps
{
    legend: LegendData[];
}

const MapLegend = memo(({ legend }: MapLegendProps): JSX.Element => {
    const datasetMetaData = useAnalyticsStore((state) => state.dataset);
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    return (
        <Box 
            position="absolute"
            bottom="20px" right="20px"
            bg={isDark ? "secondary" : "text"}
            p={3} gap={2} zIndex={1000}
            w="150px"
        >
            <VStack align="start" gap={2}>
                {legend.map((item, index) => (
                    <HStack key={index} gap={2}>
                        <Box 
                            bg={item.color}
                            border="1px solid"
                            borderColor={isDark ? "variantDark" : "variantLight"}
                            w="20px" h="20px"
                        />

                        <Text 
                            className="title-styles" 
                            color={isDark ? "text" : "secondary"}
                            fontSize="md" fontWeight="semibold"
                        >
                            {item.range}
                        </Text>
                    </HStack>
                ))}

                <Text 
                    className="title-styles" 
                    color={isDark ? "text" : "secondary"}
                    fontSize="sm" fontWeight="semibold"
                >
                    {`${datasetMetaData.legend}: ${datasetMetaData.unit}`}
                </Text>
            </VStack>
        </Box>
    );
});

export default MapLegend;
