import { memo, JSX, useContext } from "react";
import { HStack, VStack, Text, Icon, Spinner } from "@chakra-ui/react";
import { LuChartColumnBig, LuPanelLeft } from "react-icons/lu";
import { ThemeContext } from "@/contexts/themeContext";
import { IconButton } from "@/components/IconButton";

interface ChartProps
{
	tittle?: string;
	isOpen: boolean;
	isLoading: boolean;
	onToggle: () => void;
}

const ChartHeader = memo(({ 
	isOpen, 
	onToggle,
	isLoading,
	tittle
}: ChartProps): JSX.Element => {
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	return (
		<HStack
			w="100%"
			minH="50px"
			borderBottom={isOpen ? "1px solid" : "none"}
			borderColor={isDark ? "variantDark" : "variantLight"}
			color={isDark ? "text" : "secondary"}
			align="center"
			justify="space-between"
			px={isOpen ? 2 : 1}
		>
			{!isOpen && (
				<IconButton
					aria-label="Open Insights" disabled={!tittle}
					onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
						e.stopPropagation();
						onToggle();
					}}
				>
					<LuChartColumnBig />
				</IconButton>
			)}

			{isOpen && (
				<VStack w="100%" align="flex-start" p={2} gap={1}>
					<HStack  
						align="center" justify="space-between" w="100%"
						color={isDark ? "text" : "secondary"}
						gap={2}
					>
						<HStack align="center" justify="center" ml={2} gap={2}>
							<Icon size="md" aria-label='GIS Insights'>
								<LuChartColumnBig />
							</Icon>
		
							<Text 
								className="title-styles" 
								fontWeight="bold" fontSize="md" 
								color={isDark ? "text" : "secondary"}
							>
								Insights
							</Text>
						</HStack>

						<IconButton aria-label="Close Insights" onClick={onToggle}>
							<LuPanelLeft />
						</IconButton>
					</HStack>
				
					{tittle && !isLoading && (
						<Text 
							className="text-styles" 
							fontSize="sm" opacity={0.7} ml={2}
							color={isDark ? "text" : "secondary"}
						>
							{tittle}
						</Text>
					)}

					{!tittle && isLoading && (
						<VStack h="100%" justify="center" ml={2} mb={2}>
							<Spinner color={isDark ? "text" : "secondary"} size="sm" />
						</VStack>
					)}
				</VStack>
			)}
		</HStack>
	);
});

export default ChartHeader;
