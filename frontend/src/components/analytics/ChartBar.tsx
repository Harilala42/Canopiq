import { Bar } from "react-chartjs-2";
import { memo, JSX, useContext } from "react";
import { useChartBarController } from "@/hooks/useChartBarController";
import { VStack, HStack, Text, Icon, Span } from "@chakra-ui/react";
import { LuInfo, LuChartNoAxesColumn } from "react-icons/lu";
import { ThemeContext } from "@/contexts/themeContext";

const ChartBar = memo((): JSX.Element => {
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	const {
		barData,
		chartOptions,
		source,
		title
	} = useChartBarController(theme);

	return (
		<VStack
			w="100%"
			gap={5}
			align="flex-start"
			bg={isDark ? "variantDark" : "variantLight"}
			p={5}
			borderRadius="xl"
		>
			<HStack gap={2}>
				<Icon color={isDark ? "text" : "secondary"}>
					<LuChartNoAxesColumn />
				</Icon>

				<Text
					fontSize="md"
					fontWeight="bold"
					color={isDark ? "text" : "secondary"}
				>
					{title}
				</Text>
			</HStack>

			<VStack align="flex-start" gap={2}>
				<Bar data={barData} options={chartOptions} />

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

export default ChartBar;
