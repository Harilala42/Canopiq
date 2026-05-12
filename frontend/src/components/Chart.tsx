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
import { Bar } from "react-chartjs-2";
import { useContext, memo, JSX } from "react";
import { VStack, HStack, Text, Icon, Stat, Badge, Span } from '@chakra-ui/react';
import { LuChartColumnBig, LuMap, LuPanelLeft, LuArrowDown, LuArrowUp, LuTreePine, LuCloud, LuInfo, LuAlignEndHorizontal } from "react-icons/lu";
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import { ThemeContext } from "@/contexts/themeContext";
import { IconButton } from "@/components/IconButton";

ChartJS.register(
	BarElement,
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
	const datasetMetaData = useAnalyticsStore((state) => state.dataset);
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
					{datasetMetaData.type != "tree_cover" ? <LuCloud /> : <LuTreePine /> }
				</Icon>

				<VStack flex={1} align="flex-start" gap={1}>
					<Stat.Label>
						<Text 
							className="text-style"
							color={theme === "dark" ? "text" : "secondary"}
							fontSize="md" fontWeight="bold"
						>
							{datasetMetaData.legend}
						</Text>
					</Stat.Label>

					<HStack>
						<Stat.ValueText>
							<Text 
								className="title-style" fontSize="2xl"
								color={theme === "dark" ? "text" : "secondary"}
							>
								{datasetValue} {datasetMetaData.unit}
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
							Between {rangeTimes.start} - {rangeTimes.end}
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
							className="text-style"
							color={theme === "dark" ? "text" : "secondary"}
							fontSize="md" fontWeight="bold"
						>
							Area Coverage
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

const ChartBar = memo((): JSX.Element => {
	const datasetMetaData = useAnalyticsStore((state) => state.dataset);
	const datasetTimeSeries = useAnalyticsStore((state) => state.dataset_time_series);
	const { theme } = useContext(ThemeContext);

	const barData = {
		labels: datasetTimeSeries.map((item) => item.year),

		datasets: [
			{
				label: "",
				data: datasetTimeSeries.map((item) => item.value),

				borderRadius: 5,
				backgroundColor: datasetTimeSeries.map((item) => item.color)
			}
		]
	};

	const chartOptions = {
		responsive: true,

		plugins: {
			legend: {
				display: false
			},
		},

		scales: {
			x: {
				ticks: {
					color: theme === "dark" ? "#cecbf6" : "#1a1535",
				},

				grid: {
					color: theme === "dark" ? "#cecbf6" : "#1a1535",
				},
			},

			y: {
				ticks: {
					color: theme === "dark" ? "#cecbf6" : "#1a1535",
				},

				grid: {
					color: theme === "dark" ? "#cecbf6" : "#1a1535",
				},
			},
		},
	};

	return (
		<VStack
			w="100%" h="fit-content" 
			gap={5} align="flex-start"
			bg={theme === "dark" ? "variantDark" : "variantLight"}
			p={5} borderRadius="xl"
		>
			<HStack gap={2}>
				<Icon color={theme === "dark" ? "text" : "secondary"} size="lg">
					<LuAlignEndHorizontal />
				</Icon>

				<Text 
					className="title-style" 
					color={theme === "dark" ? "text" : "secondary"}
					fontSize="md" fontWeight="bold"
				>
					{`Yearly ${
						datasetMetaData.type
							.split("_")
							.map(w => w.charAt(0).toUpperCase() + w.slice(1))
							.join(" ")}
						(${datasetMetaData.unit})`
					}
				</Text>
			</HStack>

			<VStack align="flex-start" gap={2}>
				<Bar data={barData} options={chartOptions} />

				<HStack gap={2}>
					<Icon color={theme === "dark" ? "text" : "secondary"} size="sm">
						<LuInfo />
					</Icon>

					<Text 
						className="text-style" fontSize="sm" 
						color={theme === "dark" ? "text" : "secondary"}
					>
						<Span fontWeight="semibold" textDecoration="underline">Source:</Span> {datasetMetaData.source}
					</Text>
				</HStack>
			</VStack>
		</VStack>
	);
});

const Chart = ({ isOpen, onToggle }: ChartProps): JSX.Element => {
	const { theme } = useContext(ThemeContext);

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

					<ChartBar />
				</VStack>
			)}
		</VStack>
	);
}

export default Chart;
