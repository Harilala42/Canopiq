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
import useMapStore from "@/stores/useMapStore";
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
	const brandColor = isDark ? "text" : "secondary"

	return (
		<Stat.Root
			w="100%" h="100%"
			alignItems="flex-start" justifyContent="center"
			bg={isDark ? "secondary" : "text"}
			borderRadius="xl" p={5}
		>
			<HStack gap={4}>
				<Icon color={brandColor} size="2xl">
					{icon}
				</Icon>

				<VStack flex={1} align="flex-start" gap={2} px={2}>
					<Stat.Label>
						<Text className="text-styles" color={brandColor} fontSize="md" fontWeight="bold">
							{label}
						</Text>
					</Stat.Label>

					<HStack>
						<Stat.ValueText>
							<Text className="title-styles" color={brandColor} fontSize="2xl">
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
							<Text className="text-styles" color={brandColor} fontWeight="bold" fontSize="sm">
								{helpText}
							</Text>
						</Stat.HelpText>
					)}
				</VStack>
			</HStack>
		</Stat.Root>
	);
}

const ChartCard = memo((): JSX.Element | null => {
	const location = useMapStore((state) => state.location);
	const dataset = useAnalyticsStore((state) => state.dataset);
	const averageValue = useAnalyticsStore((state) => state.global_average);
	const areaCoverage = useAnalyticsStore((state) => state.area_coverage);
	const totalChange = useAnalyticsStore((state) => state.total_change);
	const rangeTimes = useAnalyticsStore((state) => state.range_times);

	if (!dataset) return null;
	const { type, legend, unit } = dataset;
	return (
		<VStack 
			w="fit-content"
			position="absolute"
			top="20px" left="20px"
			gap={2} zIndex={1000}
		>
			<StatsCard
				label={legend}
				value={`${averageValue} ${unit}`}
				icon={type !== "tree_cover" ? <LuCloud /> : <LuTreePine />}
				helpText={`Between ${rangeTimes.start} - ${rangeTimes.end}`}
				badgeValue={totalChange}
			/>

			<StatsCard
				icon={<LuMap />}
				label="Area Coverage"
				value={`${Math.round(areaCoverage / 100)} km²`}
				helpText={`In ${location}`}
			/>
		</VStack>
	);
});

export default ChartCard;
