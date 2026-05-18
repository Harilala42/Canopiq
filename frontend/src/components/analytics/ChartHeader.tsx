import { memo, JSX, useContext } from "react";
import { HStack, Text, Icon } from "@chakra-ui/react";
import { LuChartColumnBig, LuPanelLeft } from "react-icons/lu";
import { ThemeContext } from "@/contexts/themeContext";
import { IconButton } from "@/components/IconButton";

interface ChartProps
{
	isOpen: boolean;
	onToggle: () => void;
}

const ChartHeader = memo(({ isOpen, onToggle }: ChartProps): JSX.Element => {
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
					aria-label="Open Insights"
					onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
						e.stopPropagation();
						onToggle();
					}}
				>
					<LuChartColumnBig />
				</IconButton>
			)}

			{isOpen && (
				<>
					<HStack gap={2} ml={3}>
						<Icon size="md">
							<LuChartColumnBig />
						</Icon>

						<Text
							fontWeight="bold"
							fontSize="md"
							color={isDark ? "text" : "secondary"}
						>
							Insights
						</Text>
					</HStack>

					<IconButton aria-label="Close Insights" onClick={onToggle}>
						<LuPanelLeft />
					</IconButton>
				</>
			)}
		</HStack>
	);
});

export default ChartHeader;
