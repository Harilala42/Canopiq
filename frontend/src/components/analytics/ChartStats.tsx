import { memo, JSX, useContext } from "react";
import {
	VStack,
	HStack,
	Text,
	Icon,
	Stat,
	Badge
} from "@chakra-ui/react";
import {
	LuMap,
	LuArrowDown,
	LuArrowUp,
	LuTreePine,
	LuCloud
} from "react-icons/lu";
import useAnalyticsStore from "@/stores/useAnalyticsStore";
import { ThemeContext } from "@/contexts/themeContext";

const ChartStats = memo((): JSX.Element => {
	const datasetMetaData = useAnalyticsStore((state) => state.dataset);
	const datasetValue = useAnalyticsStore((state) => state.global_average);
	const areaCoverage = useAnalyticsStore((state) => state.area_coverage);
	const totalChange = useAnalyticsStore((state) => state.total_change);
	const rangeTimes = useAnalyticsStore((state) => state.range_times);

	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	return (
		<>
			<Stat.Root
				w="100%"
				bg={isDark ? "variantDark" : "variantLight"}
				p={5}
				borderRadius="xl"
			>
				<HStack gap={4}>
					<Icon color={isDark ? "text" : "secondary"} size="2xl">
						{datasetMetaData.type !== "tree_cover"
							? <LuCloud />
							: <LuTreePine />}
					</Icon>

					<VStack flex={1} align="flex-start" gap={1}>
						<Stat.Label>
							<Text
								fontSize="md"
								fontWeight="bold"
								color={isDark ? "text" : "secondary"}
							>
								{datasetMetaData.legend}
							</Text>
						</Stat.Label>

						<HStack>
							<Stat.ValueText>
								<Text
									fontSize="2xl"
									color={isDark ? "text" : "secondary"}
								>
									{datasetValue} {datasetMetaData.unit}
								</Text>
							</Stat.ValueText>

							<Badge colorPalette={totalChange > 0 ? "green" : "red"}>
								{totalChange > 0
									? <LuArrowUp />
									: <LuArrowDown />}
								{Math.round(totalChange)}%
							</Badge>
						</HStack>

						<Stat.HelpText>
							<Text
								fontSize="sm"
								color={isDark ? "text" : "secondary"}
							>
								Between {rangeTimes.start} - {rangeTimes.end}
							</Text>
						</Stat.HelpText>
					</VStack>
				</HStack>
			</Stat.Root>

			<Stat.Root
				w="100%"
				bg={isDark ? "variantDark" : "variantLight"}
				p={5}
				borderRadius="xl"
			>
				<HStack gap={4}>
					<Icon color={isDark ? "text" : "secondary"} size="2xl">
						<LuMap />
					</Icon>

					<VStack flex={1} align="flex-start" justify="center" gap={1}>
						<Stat.Label>
							<Text
								fontSize="md"
								fontWeight="bold"
								color={isDark ? "text" : "secondary"}
							>
								Area Coverage
							</Text>
						</Stat.Label>

						<Stat.ValueText>
							<Text
								fontSize="2xl"
								color={isDark ? "text" : "secondary"}
							>
								{Math.round(areaCoverage / 100)} km²
							</Text>
						</Stat.ValueText>
					</VStack>
				</HStack>
			</Stat.Root>
		</>
	);
});

export default ChartStats;
