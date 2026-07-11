import logo from "@/assets/logo.svg";
import { HStack, Image } from "@chakra-ui/react";
import { LuPanelLeft, LuPanelRight } from "react-icons/lu";
import { IconButton } from "@/components/IconButton";
import { memo } from "react";

interface SideBarHeaderProps
{
	isExpanded: boolean;
	isCanceled: boolean;
	onToggle: () => void;
}

const SideBarHeader = memo(({ 
	isExpanded, 
	isCanceled, 
	onToggle
}: SideBarHeaderProps) => {
    return (
		<HStack
			align="center"
			justify={isExpanded ? "space-between" : "center"}
			h="60px"
			w="100%"
		>
			{isExpanded || !isCanceled
				? <Image src={logo} alt="Canopiq logo" boxSize="30px" />
				: <IconButton aria-label="Expand sidebar"><LuPanelLeft /></IconButton>
			}

			{isExpanded && (
				<IconButton aria-label="Collapse sidebar" onClick={onToggle}>
					<LuPanelRight />
				</IconButton>
			)}
		</HStack>
    );
});

export default SideBarHeader;
