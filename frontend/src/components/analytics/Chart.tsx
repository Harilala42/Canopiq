import {
	ChartHeader,
	ChartStats,
	ChartDonut,
	ChartBar
} from "@/components/analytics";
import { useContext, JSX } from "react";
import { VStack } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";
import { useChartController } from "@/hooks/useChartController";
import useAnalyticsStore from "@/stores/useAnalyticsStore";

const Chart = (): JSX.Element => {
	const landCover = useAnalyticsStore((state) => state.land_use);
	const dataset = useAnalyticsStore((state) => state.dataset);
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	const { 
		isOpen,
        onToggle,
		isFetching,
		location
	} = useChartController();

	return (
		<VStack
			align="stretch"
			bg={isDark ? "secondary" : "text"}
			borderLeft="1px solid"
			borderColor={isDark ? "variantDark" : "variantLight"}
			w="100%"
			h="100%"
			maxH="calc(100vh - 60px)"
			onClick={() => !isOpen && onToggle()}
			gap={0}
		>
			<ChartHeader 
				isOpen={isOpen} 
				onToggle={onToggle}
				isLoading={isFetching}
				tittle={location ? `In ${location}` : undefined}
			/>

			{isOpen && (
				<VStack
					flex={1}
					w="100%"
					align="stretch"
					overflowY="auto"
					p={5} gap={2}
				>
					{/* Global Stats */}
					<ChartStats />

					{/* Bar Chart for Yearly Time Series */}
					<ChartBar barData={dataset} />

					{/* Donut Chart for Land Cover Categories */}
					<ChartDonut donutData={landCover} />
				</VStack>
			)}
		</VStack>
	);
};

export default Chart;
