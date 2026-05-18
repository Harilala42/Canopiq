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
import { JSX, useContext } from "react";
import { VStack } from "@chakra-ui/react";
import { ThemeContext } from "@/contexts/themeContext";

ChartJS.register(
	BarElement,
	ArcElement,
	PointElement,
	LinearScale,
	CategoryScale,
	Tooltip,
	Legend
);

interface ChartProps
{
	isOpen: boolean;
	onToggle: () => void;
}

const Chart = ({ isOpen, onToggle }: ChartProps): JSX.Element => {
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

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
			/>

			{isOpen && (
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
