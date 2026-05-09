import {
	Chart as ChartJS,
	BarElement,
	PointElement,
	LinearScale,
	CategoryScale,
	Tooltip,
	Legend,
	LineElement
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { useContext, useState, useMemo, memo, JSX } from "react";
import { LuChartColumnBig, LuHeartPulse, LuMap, LuPanelLeft, LuArrowDown, LuArrowUp, LuTreePine, LuCloud } from "react-icons/lu";
import { VStack, HStack, Text, Icon, Select, Stat, Badge, Portal, createListCollection } from '@chakra-ui/react';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { ThemeContext } from "@/contexts/themeContext";
import { IconButton } from "@/components/IconButton";

ChartJS.register(
	BarElement,
	LineElement,
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

const ChartHeader = memo(({ isOpen, onToggle }: ChartProps): JSX.Element => {
	const { theme } = useContext(ThemeContext);

	return (
		<HStack 
			w="100%" minH="50px"
			borderBottom={ isOpen ? "1px solid" : "none" }
			borderColor={theme === "dark" ? "variantDark" : "variantLight"}
			color={theme === "dark" ? "text" : "secondary"} 
			align="center" justify="space-between"
			px={isOpen ? 2 : 1}
		>
			{!isOpen && (
				<IconButton
					aria-label='Open Insights'
					onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
						e.stopPropagation();
						onToggle();
					}}
				>
					<LuChartColumnBig />
				</IconButton>
			)}

			{isOpen && (<>
				<HStack gap={2} ml={3}>
					<Icon size="md" aria-label='Insights Icon'>
						<LuChartColumnBig />
					</Icon>

					<Text className="title-styles" fontWeight="bold" fontSize="md" color={theme === "dark" ? "text" : "secondary"}>
						Insights
					</Text>
				</HStack>

				<IconButton aria-label='Close Insights' onClick={onToggle}>
					<LuPanelLeft />
				</IconButton>
			</>)}
		</HStack>
	);
});

const ChartStats = memo((): JSX.Element => {
	const datasetType = useAnalyticsStore((state) => state.dataset);
	const datasetValue = useAnalyticsStore((state) => state.global_average);
	const areaCoverage = useAnalyticsStore((state) => state.area_coverage);
	const totalChange = useAnalyticsStore((state) => state.total_change);
	const rangeTimes = useAnalyticsStore((state) => state.range_times);

	const { theme } = useContext(ThemeContext);

	return (<>
		<Stat.Root 
			w="100%" maxH="fit-content"
			bg={theme === "dark" ? "variantDark" : "variantLight"}
			p={5} borderRadius="xl"
		>
			<HStack gap={4}>
				<Icon color={theme === "dark" ? "text" : "secondary"} size="2xl">
					{datasetType != "tree_cover" ? <LuCloud /> : <LuTreePine /> }
				</Icon>

				<VStack flex={1} align="flex-start" gap={1}>
					<Stat.Label>
						<Text 
							className="text-style" fontSize="md" 
							color={theme === "dark" ? "text" : "secondary"}
						>
							{datasetType != "tree_cover" ? "Biomass Carbon Density" : "Percent Tree Cover"}
						</Text>
					</Stat.Label>

					<HStack>
						<Stat.ValueText>
							<Text 
								className="title-style" fontSize="2xl"
								color={theme === "dark" ? "text" : "secondary"}
							>
								{datasetValue} {datasetType != "tree_cover" ? "tC/ha" : "%" }
							</Text>
						</Stat.ValueText>
						<Badge colorPalette={totalChange > 0 ? "green" : "red"}>
							{totalChange > 0 ? <LuArrowUp /> : <LuArrowDown />}
							{Math.round(totalChange)}%
						</Badge>
					</HStack>

					<Stat.HelpText>
						<Text 
							className="text-style" fontSize="sm" 
							color={theme === "dark" ? "text" : "secondary"}
						>
							Since {Math.abs(rangeTimes.start - rangeTimes.end)} years ago
						</Text>
					</Stat.HelpText>
				</VStack>
			</HStack>
		</Stat.Root>

		<Stat.Root 
			w="100%" maxH="fit-content"
			bg={theme === "dark" ? "variantDark" : "variantLight"}
			p={5} borderRadius="xl"
		>
			<HStack gap={4}>
				<Icon color={theme === "dark" ? "text" : "secondary"} size="2xl">
					<LuMap />
				</Icon>

				<VStack flex={1} align="flex-start" gap={1}>
					<Stat.Label>
						<Text 
							className="text-style" fontSize="md"
							color={theme === "dark" ? "text" : "secondary"}
						>
							Study Area
						</Text>
					</Stat.Label>

					<Stat.ValueText>
						<Text 
							className="title-style" fontSize="2xl"
							color={theme === "dark" ? "text" : "secondary"}
						>
							{Math.round(areaCoverage / 100)} km²
						</Text>
					</Stat.ValueText>
				</VStack>
			</HStack>
		</Stat.Root>
	</>);
});

const Chart = ({ isOpen, onToggle }: ChartProps): JSX.Element => {
	const { theme } = useContext(ThemeContext);

	// const groupedByYear = useMemo(() => {
	// 	const grouped: Record<string, any[]> = {};

	// 	monthlyHealth.forEach(item => {
	// 		const year = item.date.split(" ")[1];

	// 		if (!grouped[year]) grouped[year] = [];

	// 		grouped[year].push(item);
	// 	});

	// 	return grouped;
	// }, []);

	// const years = Object.keys(groupedByYear);
	// const [selectedYear, setSelectedYear] = useState<string>(years[9]);

	// const yearCollection = createListCollection({
	// 	items: years.map(year => ({
	// 		label: year,
	// 		value: year,
	// 	})),
	// });

	// const barData = {
	// 	labels: yearlyBars.map(item => item.year),

	// 	datasets: [
	// 		{
	// 			label: "Carbon Stock",

	// 			data: yearlyBars.map(item => item.value),

	// 			backgroundColor: [
	// 				"#38A169",
	// 				"#48BB78",
	// 				"#68D391",
	// 				"#9AE6B4",
	// 				"#276749",
	// 				"#2F855A",
	// 				"#38A169",
	// 				"#48BB78",
	// 			],

	// 			borderRadius: 8,
	// 			borderSkipped: false,
	// 		},
	// 	],
	// };

	// const chartOptions = {
	// 	responsive: true,

	// 	plugins: {
	// 		legend: {
	// 			labels: {
	// 				color: theme === "dark" ? "#cecbf6" : "#1a1535",
	// 			},
	// 		},
	// 	},

	// 	scales: {
	// 		x: {
	// 			ticks: {
	// 				color: theme === "dark" ? "#cecbf6" : "#1a1535",
	// 			},

	// 			grid: {
	// 				color: theme === "dark" ? "#cecbf6" : "#1a1535",
	// 			},
	// 		},

	// 		y: {
	// 			ticks: {
	// 				color: theme === "dark" ? "#cecbf6" : "#1a1535",
	// 			},

	// 			grid: {
	// 				color: theme === "dark" ? "#cecbf6" : "#1a1535",
	// 			},
	// 		},
	// 	},
	// };

	// const lineData = {
	// 	labels: groupedByYear[selectedYear].map(item =>
	// 		item.date.split(" ")[0]
	// 	),

	// 	datasets: [
	// 		{
	// 			label: `NDVI ${selectedYear}`,
	// 			data: groupedByYear[selectedYear].map(item => item.value),
	// 			borderColor: "#38A169",
	// 			backgroundColor: "rgba(56, 161, 105, 0.2)",
	// 			tension: 0.4,
	// 			fill: true,
	// 		},
	// 	],
	// };

	return (
		<VStack 
			align="stretch"
			bg={ theme === "dark" ? "secondary" : "text" } 
			borderLeft="1px solid" borderColor={ theme === "dark" ? "variantDark" : "variantLight" }
			w="100%" h="100%" maxH="calc(100vh - 60px)" 
			onClick={() => !isOpen && onToggle()}
			gap={0}
		>
			<ChartHeader isOpen={isOpen} onToggle={onToggle} />

			{isOpen && (
				<VStack flex={1} justify="stretch" w="100%" p={5}>
					<ChartStats />

					{/* <VStack
						w="100%" h="fit-content" gap={2} align="flex-start"
						bg={theme === "dark" ? "variantDark" : "variantLight"}
						p={5} borderRadius="xl"
					>
						<Text 
							className="text-style" fontSize="sm" 
							color={theme === "dark" ? "text" : "secondary"}
						>
							Yearly Carbon Stock
						</Text>

						<Bar data={barData} options={chartOptions} />
					</VStack> */}

					{/* <VStack
						w="100%" h="fit-content" gap={2} align="flex-start"
						bg={theme === "dark" ? "variantDark" : "variantLight"}
						p={5} borderRadius="xl"
					>
						<HStack justify="space-between" mb={4}>
							<Text 
								className="text-style" fontSize="sm" 
								color={theme === "dark" ? "text" : "secondary"}
							>
								<LuHeartPulse /> Monthly NDVI
							</Text>

							<Select.Root collection={yearCollection} size="sm" width="320px">
								<Select.Control>
									<Select.Trigger>
										<Select.ValueText placeholder={years[1]} />
									</Select.Trigger>
								</Select.Control>
								<Portal>
									<Select.Positioner>
									<Select.Content>
										{years.map(year => (
											<Select.Item key={year} item={year}>
												{year}
											</Select.Item>
										))}
									</Select.Content>
									</Select.Positioner>
								</Portal>
							</Select.Root>
						</HStack>

						<Line data={lineData} options={chartOptions} />
					</VStack> */}
				</VStack>
			)}
		</VStack>
	);
}

export default Chart;
