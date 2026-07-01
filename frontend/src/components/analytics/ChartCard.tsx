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
import { AnalyticsMetadata, AnalyticsStats } from "@/types/analysis";
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
	const currentAnalysis = useAnalyticsStore((state) => state.activeAnalysis);
	if (!currentAnalysis) return null;

	const meta = currentAnalysis.analytics.metadata as AnalyticsMetadata;
	const stats = currentAnalysis.analytics.stats as AnalyticsStats;
	return (
		<VStack 
			minW="300px"
			position="absolute"
			top="20px" left="20px"
			gap={2} zIndex={1000}
		>
			{meta?.type != "land_use_distribution" && (
				<StatsCard
					label={meta?.legend}
					value={`${stats?.global_average} ${meta?.unit}`}
					icon={meta?.type !== "tree_cover" ? <LuCloud /> : <LuTreePine />}
					helpText={
						`Between ${currentAnalysis?.start_year.split("-")[0]} \ 
						- ${currentAnalysis?.end_year.split("-")[0]}`}
					badgeValue={stats?.total_change_percent}
				/>
			)}

			<StatsCard
				icon={<LuMap />}
				label="Area Coverage"
				value={`${Math.round(stats?.area_coverage_ha / 100)} km²`}
				helpText={`In ${currentAnalysis?.location}`}
			/>
		</VStack>
	);
});

export default ChartCard;
