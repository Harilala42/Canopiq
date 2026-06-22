import { useContext, JSX } from "react";
import { 
    BarChart,
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as ReChartToolTip, 
    ResponsiveContainer
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/analytics";
import { LuChartNoAxesColumn } from "react-icons/lu";
import { ThemeContext } from "@/contexts/themeContext";
import { DatasetData } from "@/types/analysis";

interface ChartBarProps
{
    barData?: DatasetData;
}

const ChartBar = ({ barData }: ChartBarProps): JSX.Element => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

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
};

export default ChartBar;
