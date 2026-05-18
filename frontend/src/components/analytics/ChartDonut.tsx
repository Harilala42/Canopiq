import { Doughnut } from "react-chartjs-2";
import { memo, JSX, useContext } from "react";
import { LuInfo, LuLandPlot } from "react-icons/lu";
import { ThemeContext } from "@/contexts/themeContext";
import { VStack, HStack, Text, Icon, Span } from "@chakra-ui/react";
import { useChartDonutController } from "@/hooks/useChartDonutController";

const ChartDonut = memo((): JSX.Element => {
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	const {
		donutData,
		options,
		legend,
		unit,
		source
	} = useChartDonutController(theme);

	return (
		<VStack
			w="100%"
			gap={5}
			bg={isDark ? "variantDark" : "variantLight"}
			p={5}
			borderRadius="xl"
		>
			<HStack w="100%" gap={2}>
				<Icon color={isDark ? "text" : "secondary"}>
					<LuLandPlot />
				</Icon>

				<Text
					fontSize="md"
					fontWeight="bold"
					color={isDark ? "text" : "secondary"}
				>
					{legend} ({unit})
				</Text>
			</HStack>

			<VStack align="flex-start" gap={2}>
				<Doughnut data={donutData} options={options} />

				<HStack gap={2}>
					<Icon color={isDark ? "text" : "secondary"}>
						<LuInfo />
					</Icon>

					<Text
						fontSize="sm"
						color={isDark ? "text" : "secondary"}
					>
						<Span fontWeight="semibold" textDecoration="underline">
							Source:
						</Span>{" "}
						{source}
					</Text>
				</HStack>
			</VStack>
		</VStack>
	);
});

export default ChartDonut;
