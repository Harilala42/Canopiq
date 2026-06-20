import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
	Tooltip as ReChartToolTip,
    ResponsiveContainer,
    TooltipProps
} from "recharts";
import { VStack, HStack, Skeleton, Text, Icon, Span } from "@chakra-ui/react";
import { LuInfo, LuChartNoAxesColumn } from "react-icons/lu";
import { ThemeContext } from "@/contexts/themeContext";
import { DatasetData } from "@/types/analysis";
import { useContext, memo, JSX } from "react";

interface BarTooltipProps extends TooltipProps
{
    payload?: any;
    unit: string;
}

const BarTooltip = memo(({active, payload, unit}: BarTooltipProps) => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    if (!active || !payload?.length) return null;

    const { year: label, value } = payload[0].payload;

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

interface ChartBarProps
{
    barData?: DatasetData;
}

const ChartBar = ({barData}: ChartBarProps): JSX.Element => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    if (!barData)
        return (
            <Skeleton 
                flex={1} w="100%" borderRadius="xl" 
                bg={isDark ? "variantDark" : "variantLight"}
            />
        )

    const { time_series: data, legend, unit, source } = barData;

    return (
        <VStack
            w="100%"
            gap={5} p={5}
            align="flex-start"
            bg={isDark ? "variantDark" : "variantLight"}
            borderRadius="xl"
        >
			<HStack justify="center" w="100%" gap={2}>
				<Icon color={isDark ? "text" : "secondary"} size="md">
					<LuChartNoAxesColumn />
				</Icon>
				<Text
					fontSize="md"
					fontWeight="bold"
					color={isDark ? "text" : "secondary"}
				>
					{`${legend} (${unit})`}
				</Text>
			</HStack>

            <VStack align="flex-start" gap={2} w="100%">
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 10, left: -30, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? "#cecbf6" : "#1a1535"}
                            opacity={0.2}
                        />

                        <XAxis
                            dataKey="year"
                            tick={{ fill: isDark ? "#cecbf6" : "#1a1535", fontSize: 12 }}
                            axisLine={{ stroke: isDark ? "#cecbf6" : "#1a1535" }}
                            tickLine={false}
                        />

                        <YAxis
                            tick={{ fill: isDark ? "#cecbf6" : "#1a1535", fontSize: 12 }}
                            axisLine={{ stroke: isDark ? "#cecbf6" : "#1a1535" }}
                            tickLine={false}
                        />

                        <ReChartToolTip 
							content={<BarTooltip unit={unit} />}
							cursor={{ fill: isDark ? "#cecbf60d" : "#1a15350d" }}
 						/>

						<Bar
							dataKey="value"
							shape={(props: any) => {
								const { x, y, width, height, index } = props;
								
								return (
									<rect
										x={x} y={y}
										width={width} height={height}
										fill={data[index]?.color}
										rx={5} ry={5}
									/>
								);
							}}
						/>
                    </BarChart>
                </ResponsiveContainer>

                <HStack justify="center" w="100%" gap={2}>
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
        </VStack>
    );
};

export default ChartBar;
