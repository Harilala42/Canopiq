import logo from "@/assets/logo.svg";
import { HStack, Image } from "@chakra-ui/react";
import { LuPanelLeft, LuPanelRight } from "react-icons/lu";
import { IconButton } from "@/components/IconButton";
import { memo } from "react";

interface SideBarHeaderProps
{
	isExpanded: boolean;
	isHovered: boolean;
	onToggle: () => void;
}

const SideBarHeader = memo(({ 
	isExpanded, 
	isHovered, 
	onToggle
}: SideBarHeaderProps) => {
    return (
		<HStack
			align="center"
			justify={isExpanded ? "space-between" : "center"}
			h="60px"
			w="100%"
		>
			{isHovered && !isExpanded ? (
				<IconButton aria-label="Expand sidebar">
					<LuPanelLeft />
				</IconButton>
			) : (
				<Image src={logo} alt="Canopiq logo" boxSize="30px" />
			)}

			{isExpanded && (
				<IconButton
					aria-label="Collapse sidebar"
					onClick={(e) => {
						e.stopPropagation();
						onToggle();
					}}
				>
					<LuPanelRight />
				</IconButton>
			)}
		</HStack>
    );
});

export default SideBarHeader;
