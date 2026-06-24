import { useContext, memo, JSX } from "react";
import { 
    BarChart,
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as ReChartToolTip, 
    ResponsiveContainer
} from "recharts";
import useAnalyticsStore from "@/stores/useAnalyticsStore";
import { ChartContainer, ChartTooltip } from "@/components/analytics";
import { ThemeContext } from "@/contexts/themeContext";
import { LuChartNoAxesColumn } from "react-icons/lu";
import { Box, Skeleton } from "@chakra-ui/react";

interface ChartBarProps
{
    GISAnalysisId?: string;
}

const ChartBar = memo(({ GISAnalysisId }: ChartBarProps): JSX.Element => {
    const barData = useAnalyticsStore((state) => state.dataset);
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    if (!barData)
        return (
            <Skeleton 
                flex={1} w="100%" borderRadius="xl" 
                bg={isDark ? "variantDark" : "variantLight"}
            />
        )

    const { time_series: data = [], legend = "", unit = "", source = "" } = barData || {};
    const themeColor = isDark ? "#cecbf6" : "#1a1535";

    return (
        <ChartContainer 
            hasData={!!barData} 
            legend={legend} 
            unit={unit} 
            source={source} 
            icon={LuChartNoAxesColumn}
        >
            <Box flex={1} w="100%" minW="0">
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={themeColor} opacity={0.2} />
                        <XAxis dataKey="year" tick={{ fill: themeColor, fontSize: 12 }} axisLine={{ stroke: themeColor }} tickLine={false} />
                        <YAxis tick={{ fill: themeColor, fontSize: 12 }} axisLine={{ stroke: themeColor }} tickLine={false} />
                        
                        <ReChartToolTip 
                            content={<ChartTooltip unit={unit} labelKey="year" labelValue="value" />} 
                            cursor={{ fill: `${themeColor}0d` }} 
                        />

                        <Bar
                            dataKey="value"
                            shape={(props: any) => (
                                <rect 
                                    x={props.x} y={props.y} 
                                    width={props.width} height={props.height} 
                                    fill={data[props.index]?.color} 
                                    rx={5} ry={5}
                                />
                            )}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </ChartContainer>
    );
});

export default ChartBar;
