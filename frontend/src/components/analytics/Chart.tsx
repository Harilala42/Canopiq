import {
	Chart as ChartJS,
	BarElement,
	ArcElement,
	PointElement,
	LinearScale,
	CategoryScale,
	Tooltip,
	Legend
} from "chart.js";
import {
	ChartHeader,
	ChartStats,
	ChartDonut,
	ChartBar
} from "@/components/analytics";
import { useContext, JSX } from "react";
import { Skeleton, VStack } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";
import { useChartController } from "@/hooks/useChartController";

ChartJS.register(
	BarElement,
	ArcElement,
	PointElement,
	LinearScale,
	CategoryScale,
	Tooltip,
	Legend
);

const Chart = (): JSX.Element => {
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	const { 
		isOpen,
        onToggle,
		isLoading,
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
				isLoading={isLoading}
				tittle={location ? `In ${location}` : undefined}
			/>

			{isOpen && isLoading && (
				<VStack h="100%" align="stretch" p={5} gap={5}>
					<Skeleton height="100px" width="100%" borderRadius="xl" bg={isDark ? "variantDark" : "variantLight"} />
					<Skeleton height="100px" width="100%" borderRadius="xl" bg={isDark ? "variantDark" : "variantLight"} />
					<Skeleton flex={1} width="100%" borderRadius="xl" bg={isDark ? "variantDark" : "variantLight"} />
					<Skeleton flex={1} width="100%" borderRadius="xl" bg={isDark ? "variantDark" : "variantLight"} />
				</VStack>
			)}

			{isOpen && !isLoading && location && (
				<VStack
					flex={1}
					w="100%"
					overflowY="auto"
					p={5}
				>
					{/* Global Stats */}
					<ChartStats />

					{/* Bar Chart for Yearly Time Series */}
					<ChartBar />

					{/* Donut Chart for Land Cover Categories */}
					<ChartDonut />
				</VStack>
			)}
		</VStack>
	);
};

export default Chart;
