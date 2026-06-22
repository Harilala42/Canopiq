import { 
    PieChart, 
    Pie, 
    Sector, 
    Tooltip as ReChartToolTip,
    ResponsiveContainer
} from "recharts";
import { LuLandPlot } from "react-icons/lu";
import { memo, JSX, useContext } from "react";
import { ThemeContext } from "@/contexts/themeContext";
import { BiomeData, LandUseData } from "@/types/analysis";
import { HStack, Box, SimpleGrid, Text } from "@chakra-ui/react";
import { ChartContainer, ChartTooltip } from "@/components/analytics";
import { useChartDonutController } from "@/hooks/useChartDonutController";

interface DonutLegendProps
{
    data: BiomeData[];
    tickColor: string;
}

const DonutLegend = memo(({ data, tickColor }: DonutLegendProps): JSX.Element => (
    <SimpleGrid columns={2} w="100%" h="100%" py={10}>
        {data.map((entry) => (
            <HStack key={entry.category} align="center" gap={2}>
                <Box w="15px" h="15px" borderRadius="full" bg={entry.color} flexShrink={0} />
                <Text fontSize="xs" fontWeight="bold" color={tickColor}>{entry.category}</Text>
            </HStack>
        ))}
    </SimpleGrid>
));

interface ChartDonutProps
{
    donutData?: LandUseData;
}

const ChartDonut = ({ donutData }: ChartDonutProps): JSX.Element => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    const { 
        categories: data, 
        legend, 
        unit, 
        source
    } = useChartDonutController(donutData || ({} as LandUseData));
    const tickColor = isDark ? "#cecbf6" : "#1a1535";

    return (
        <ChartContainer 
            hasData={!!donutData} 
            legend={legend} 
            unit={unit} 
            source={source} 
            icon={LuLandPlot}
        >
            <HStack align="flex-start" gap={2} w="100%">
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={data} 
                            dataKey="value" 
                            nameKey="category" 
                            cx="50%" cy="50%" 
                            innerRadius={60} 
                            outerRadius={90} 
                            strokeWidth={0}
                            
                            shape={(props: any) => (
                                <Sector 
                                    cx={props.cx} cy={props.cy} 
                                    fill={data[props.index]?.color}
                                    innerRadius={props.innerRadius} 
                                    outerRadius={props.outerRadius} 
                                    startAngle={props.startAngle} 
                                    endAngle={props.endAngle} 
                                />
                            )}
                        />

                        <ReChartToolTip content={<ChartTooltip unit={unit} labelKey="category" labelValue="value" />} />
                    </PieChart>
                </ResponsiveContainer>

                <DonutLegend data={data} tickColor={tickColor} />
            </HStack>
        </ChartContainer>
    );
};

export default ChartDonut;
