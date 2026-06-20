import { memo, JSX, useContext } from "react";
import {
	VStack,
	HStack,
	Text,
	Icon,
	Stat,
	Badge,
	Skeleton
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
			w="100%" h="100%"
			alignItems="flex-start" justifyContent="center"
			bg={isDark ? "variantDark" : "variantLight"}
			borderRadius="xl" p={5}
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
	const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

	const dataset = useAnalyticsStore((state) => state.dataset);
	const averageValue = useAnalyticsStore((state) => state.global_average);
	const areaCoverage = useAnalyticsStore((state) => state.area_coverage);
	const totalChange = useAnalyticsStore((state) => state.total_change);
	const rangeTimes = useAnalyticsStore((state) => state.range_times);

	if (!dataset) 
		return (
			<HStack w="100%">
				<Skeleton h="100px" flex={1} borderRadius="xl" bg={isDark ? "variantDark" : "variantLight"} />
				<Skeleton h="100px" flex={1} borderRadius="xl" bg={isDark ? "variantDark" : "variantLight"} />
			</HStack>
		)

	return (
		<HStack w="100%">
			<StatsCard
				icon={
					dataset.type !== "tree_cover"
						? <LuCloud />
						: <LuTreePine />
				}
				label={dataset.legend}
				value={`${averageValue} ${dataset.unit}`}
				helpText={`Between ${rangeTimes.start} - ${rangeTimes.end}`}
				badgeValue={totalChange}
			/>

			<StatsCard
				icon={<LuMap />}
				label="Area Coverage"
				value={`${Math.round(areaCoverage / 100)} km²`}
			/>
		</HStack>
	);
});

export default ChartStats;
