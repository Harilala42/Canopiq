import {
	Chart as ChartJS,
	BarElement,
	PointElement,
	LinearScale,
	CategoryScale,
	Tooltip,
	Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useContext, JSX } from "react";
import { VStack, HStack, Text, Icon } from '@chakra-ui/react';
import { ThemeContext } from "@/contexts/themeContext";
import { LuChartColumnBig } from "react-icons/lu";

ChartJS.register(
	BarElement,
	PointElement,
	LinearScale,
	CategoryScale,
	Tooltip,
	Legend
);

const rawData = [
	{
		"date": "2020-01",
		"value": 7.8
	},
	{
		"date": "2020-04",
		"value": 12.57
	},
	{
		"date": "2020-05",
		"value": 0.0
	},
	{
		"date": "2020-08",
		"value": 10.62
	},
	{
		"date": "2021-04",
		"value": 6
	},
	{
		"date": "2021-04",
		"value": 24.2
	},
	{
		"date": "2021-08",
		"value": 0.0
	},
	{
		"date": "2023-03",
		"value": 28.32
	},
	{
		"date": "2023-03",
		"value": 19.27
	},
	{
		"date": "2023-03",
		"value": 26.41
	},
	{
		"date": "2023-05",
		"value": 12.34
	},
	{
		"date": "2023-05",
		"value": 8.51
	},
	{
		"date": "2023-05",
		"value": 0.62
	},
	{
		"date": "2025-05",
		"value": 16.39
	},
	{
		"date": "2025-06",
		"value": 15.65
	},
	{
		"date": "2025-07",
		"value": 14.69
	},
	{
		"date": "2025-08",
		"value": 20.98
	},
	{
		"date": "2025-09",
		"value": 23.4
	},
	{
		"date": "2025-12",
		"value": 21.73
	}
] 

const Chart = (): JSX.Element => {
	const { theme } = useContext(ThemeContext);

	const parsedData = rawData.map(item => ({
		x: item.date,
		y: item.value
	}));

	const data = {
		labels: '',
		datasets: [
			{
				label: "Values over time",
				data: parsedData,
				fill: false,
				tension: 0.3
			}
		]
	};

	const options = {
		responsive: true,
		plugins: {
			legend: { display: true }
		},
		scales: {
			x: {
				title: { display: true, text: "Date" }
			},
			y: {
				title: { display: true, text: "Value" }
			}
		}
	};

	return (
		<VStack 
			align="stretch"
			bg={ theme === "dark" ? "secondary" : "text" } 
			borderLeft="1px solid" borderColor={ theme === "dark" ? "variantDark" : "variantLight" }
			w="100%" h="100%" maxH="calc(100vh - 60px)" gap={0}
		>
			<HStack 
				w="100%" minH="50px"
				borderBottom="1px solid" 
				borderColor={theme === "dark" ? "variantDark" : "variantLight"}
				color={theme === "dark" ? "text" : "secondary"} 
				align="center" justify="flex-start"
				gap={2} px={5}
			>
				<Icon size="lg" aria-label='Insights Icon'>
					<LuChartColumnBig />
				</Icon>

				<Text className="title-styles" fontWeight="bold" fontSize="md" color={theme === "dark" ? "text" : "secondary"}>
					Insights
				</Text>
			</HStack>

			<HStack flex={1} w="100%" px={5}>
				<Bar data={data} options={options} />
			</HStack>
		</VStack>
	);
}

export default Chart;
