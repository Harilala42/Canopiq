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
import { AnalyticsMetadata, TimeSeriesInsight } from "@/types/analysis";
import { ChartContainer, ChartTooltip } from "@/components/analytics";
import { ThemeContext } from "@/contexts/themeContext";
import { LuChartNoAxesColumn } from "react-icons/lu";
import { Skeleton } from "@chakra-ui/react";

interface ChartBarProps
{
    analysisId?: string;
}

const ChartBar = memo(({ analysisId }: ChartBarProps): JSX.Element => {
    const barData = useAnalyticsStore((state) => state.analyses[analysisId]);
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    if (!barData)
        return (
            <Skeleton 
                flex={1} w="100%" h="100px" borderRadius="xl" 
                bg={isDark ? "variantDark" : "variantLight"}
            />
        )

    const data = barData.analytics.insights as TimeSeriesInsight[];
    const { legend = "", unit = "", source = "" } = barData.analytics.metadata as AnalyticsMetadata;
    const themeColor = isDark ? "#cecbf6" : "#010101ff";

    return (
        <ChartContainer 
            hasData={!!barData} 
            legend={legend} 
            unit={unit} 
            source={source} 
            icon={LuChartNoAxesColumn}
        >
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
        </ChartContainer>
    );
});

export default ChartBar;
