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
	LuCloud,
	LuLandPlot
} from "react-icons/lu";
import useAnalyticsStore from "@/stores/useAnalyticsStore";
import { AnalyticsMetadata, AnalyticsStats, BiomeInsight } from "@/types/analysis";
import { ThemeContext } from "@/contexts/themeContext";

interface StatsCardProps
{
	icon: React.ReactNode;
	label: string;
	value: string | number;
	helpText?: string;
	badgeValue?: number;
	badgeArrow?: boolean;
};

const StatsCard =({
	icon,
	label,
	value,
	helpText,
	badgeValue,
	badgeArrow=false
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
								{badgeArrow && (badgeValue > 0 ? <LuArrowUp /> : <LuArrowDown />)}
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
	const insights = currentAnalysis.analytics.insights;

    const startYear = currentAnalysis.start_year?.split("-")[0];
    const endYear = currentAnalysis.end_year?.split("-")[0];

	const datasetConfig = {
        carbon_density: {
            label: `Average ${meta.legend}`,
            value: `${stats.global_average} ${meta.unit}`,
            icon: <LuCloud />,
            helpText: `Between ${startYear} - ${endYear}`,
            badgeValue: stats.total_change_percent,
			badgeArrow: true
        },
        tree_cover: {
            label: `Average ${meta.legend}`,
            value: `${stats.global_average} ${meta.unit}`,
            icon: <LuTreePine />,
            helpText: `Between ${startYear} - ${endYear}`,
            badgeValue: stats.total_change_percent,
			badgeArrow: true
        },
        land_use_distribution: {
            label: "Dominant Land-Use",
            value: (insights[0] as BiomeInsight)?.category,
            icon: <LuLandPlot />,
            helpText: undefined,
            badgeValue: insights[0]?.value,
			badgeArrow: false
        },
    }[meta.type];

	return (
		<VStack 
            w="350px"
            position="absolute"
            top="20px" left="20px"
            gap={2} zIndex={1000}
        >
            {datasetConfig && <StatsCard {...datasetConfig} />}

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
