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

interface StatsCardProps
{
	icon: React.ReactNode;
	label: string;
	value: string | number;
	helpText?: string;
	badgeValue?: number;
};

const StatsCard =({
	icon,
	label,
	value,
	helpText,
	badgeValue,
}: StatsCardProps): JSX.Element => {
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	return (
		<Stat.Root
			w="100%"
			bg={isDark ? "variantDark" : "variantLight"}
			p={5}
			borderRadius="xl"
		>
			<HStack gap={4}>
				<Icon color={isDark ? "text" : "secondary"} size="2xl">
					{icon}
				</Icon>

				<VStack flex={1} align="flex-start" gap={1}>
					<Stat.Label>
						<Text
							fontSize="md"
							fontWeight="bold"
							color={isDark ? "text" : "secondary"}
						>
							{label}
						</Text>
					</Stat.Label>

					<HStack>
						<Stat.ValueText>
							<Text
								fontSize="2xl"
								color={isDark ? "text" : "secondary"}
							>
								{value}
							</Text>
						</Stat.ValueText>

						{badgeValue && (
							<Badge colorPalette={badgeValue > 0 ? "green" : "red"}>
								{badgeValue > 0 ? <LuArrowUp /> : <LuArrowDown />}
								{Math.round(badgeValue)}%
							</Badge>
						)}
					</HStack>

					{helpText && (
						<Stat.HelpText>
							<Text
								fontWeight="bold" fontSize="sm"
								color={isDark ? "text" : "secondary"}
							>
								{helpText}
							</Text>
						</Stat.HelpText>
					)}
				</VStack>
			</HStack>
		</Stat.Root>
	);
}

const ChartStats = memo((): JSX.Element => {
	const datasetMetaData = useAnalyticsStore((state) => state.dataset);
	const datasetValue = useAnalyticsStore((state) => state.global_average);
	const areaCoverage = useAnalyticsStore((state) => state.area_coverage);
	const totalChange = useAnalyticsStore((state) => state.total_change);
	const rangeTimes = useAnalyticsStore((state) => state.range_times);

	return (
		<>
			<StatsCard
				icon={
					datasetMetaData.type !== "tree_cover"
						? <LuCloud />
						: <LuTreePine />
				}
				label={datasetMetaData.legend}
				value={`${datasetValue} ${datasetMetaData.unit}`}
				helpText={`Between ${rangeTimes.start} - ${rangeTimes.end}`}
				badgeValue={totalChange}
			/>

			<StatsCard
				icon={<LuMap />}
				label="Area Coverage"
				value={`${Math.round(areaCoverage / 100)} km²`}
			/>
		</>
	);
});

export default ChartStats;
