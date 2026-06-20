import { memo, JSX, useContext } from "react";
import { LuInfo, LuLandPlot } from "react-icons/lu";
import { ThemeContext } from "@/contexts/themeContext";
import { BiomeData, LandUseData, TimeSeriesData } from "@/types/analysis";
import { useChartDonutController } from "@/hooks/useChartDonutController";
import { VStack, HStack, Box, SimpleGrid, Skeleton, Text, Icon, Span } from "@chakra-ui/react";
import { 
    PieChart, 
    Pie, 
    Sector, 
    Tooltip as ReChartToolTip, 
    ResponsiveContainer ,
    TooltipProps
} from "recharts";

interface DonutTooltipProps extends TooltipProps
{
    payload?: any;
    unit: string;
}

const DonutTooltip = memo(({active, payload, unit}: DonutTooltipProps) => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    if (!active || !payload?.length) return null;

    const { category: label, value } = payload[0].payload;

    return (
        <VStack
            align="flex-start"
            border="1px solid" borderRadius="md"
            bg={isDark ? "secondary" : "primary"}
            borderColor={isDark ? "variantLight" : "variantDark"}
            p={2} gap={1}
        >
            <Text className="title-styles" fontSize="xs" fontWeight="bold">
                {label}
            </Text>

            <Text className="text-styles" fontSize="xs">
                {value}{unit}
            </Text>
        </VStack>
    );
});

interface DonutLegendProps
{
    data: BiomeData[];
    tickColor: string;
}

const DonutLegend = memo(({data, tickColor}: DonutLegendProps): JSX.Element => {
    return (
        <SimpleGrid columns={2} w="100%" h="100%" py={10}>
            {data.map((entry) => (
                <HStack key={entry.category} align="center" gap={2}>
                    <Box
                        w="15px" h="15px"
                        borderRadius="full"
                        bg={entry.color}
                        flexShrink={0}
                    />

                    <Text fontSize="xs" fontWeight="bold" color={tickColor}>
                        {entry.category}
                    </Text>
                </HStack>
            ))}
        </SimpleGrid>
    );
});

interface ChartDonutProps
{
    donutData?: LandUseData
}

const ChartDonut = ({donutData}: ChartDonutProps): JSX.Element => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    if (!donutData)
        return (
            <Skeleton 
                flex={1} w="100%" borderRadius="xl" 
                bg={isDark ? "variantDark" : "variantLight"}
            />
        )

    const { categories: data, legend, unit, source } = useChartDonutController(donutData);

    return (
        <VStack
            w="100%" p={5} gap={0}
            bg={isDark ? "variantDark" : "variantLight"}
            borderRadius="xl"
        >
            <HStack justify="center" w="100%" gap={2}>
                <Icon color={isDark ? "text" : "secondary"} size="md">
                    <LuLandPlot />
                </Icon>
                <Text
                    fontSize="md"
                    fontWeight="bold"
                    color={isDark ? "text" : "secondary"}
                >
                    {`${legend} (${unit})`}
                </Text>
            </HStack>

            <HStack align="flex-start" gap={2} w="100%">
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            strokeWidth={0}
                            shape={(props: any) => {
                                const { 
                                    cx, cy, 
                                    innerRadius, 
                                    outerRadius, 
                                    startAngle, 
                                    endAngle, 
                                    index
                                } = props;

                                return (
                                    <Sector
                                        cx={cx}
                                        cy={cy}
                                        innerRadius={innerRadius}
                                        outerRadius={outerRadius}
                                        startAngle={startAngle}
                                        endAngle={endAngle}
                                        fill={data[index]?.color}
                                    />
                                );
                            }}
                        />

                        <ReChartToolTip content={<DonutTooltip unit={unit} />}/>
                    </PieChart>
                </ResponsiveContainer>

                <DonutLegend data={data} tickColor={isDark ? "#cecbf6" : "#1a1535"}/>
            </HStack>

            <HStack justify="center" gap={2}>
                <Icon color={isDark ? "text" : "secondary"} size="md">
                    <LuInfo />
                </Icon>
                <Text className="text-styles" fontSize="sm" color={isDark ? "text" : "secondary"}>
                    <Span fontWeight="semibold" textDecoration="underline">
                        Source:
                    </Span>{" "}
                    {source}
                </Text>
            </HStack>
        </VStack>
    );
};

export default ChartDonut;