import logo from '@/assets/logo.svg';
import { useState, useContext, JSX } from 'react';
import { VStack, HStack, Box, Image, Text } from '@chakra-ui/react';
import { LuPanelLeft, LuPanelRight, LuCirclePlus } from 'react-icons/lu';
import { ThemeContext } from '@/contexts/themeContext';
import { IconButton } from '@/components/IconButton';
import { Button } from '@/components/Button';

interface SlideBarProps {
    isExpanded: boolean;
    onToggle: () => void;
}

export const SlideBar = (
    { isExpanded, onToggle }: SlideBarProps
): JSX.Element => {
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const { theme } = useContext(ThemeContext);

    return (
        <VStack 
            align="center" 
            justify="flex-start" 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            bg={ theme === "dark" ? "secondary" : "text" } 
            borderRight="1px solid" borderColor={ theme === "dark" ? "text" : "primary" }
            minW="50px" w={isExpanded ? "250px" : "50px"}
            onClick={() => !isExpanded && onToggle()}
            h="100%" px={2} gap={5}
        >
            <HStack 
                align="center" 
                justify={ isExpanded ? "space-between" : "center" } 
                h="60px" w="100%"
            >
                {
                    isHovered && !isExpanded
                    ? (
                        <IconButton aria-label="Expand sidebar"> 
                            <LuPanelLeft />
                        </IconButton>
                        )
                    : <Image src={logo} alt="Canopiq logo" boxSize="30px" />
                }

                {isExpanded && (
                    <IconButton 
                        aria-label="Collapse sidebar" 
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onToggle();
                        }}
                    > 
                        <LuPanelRight />
                    </IconButton>
                )}
            </HStack>

            {
                isExpanded
                ? (
                    <Button aria-label="Create new query">
                        <LuCirclePlus /> New Query
                    </Button>
                )
                : (
                    <IconButton aria-label="Create new query">
                        <LuCirclePlus />
                    </IconButton>
                )
            }

            <Box 
                w="100%"
                display={isExpanded ? "flex" : "none"} 
                alignItems="flex-start" 
                justifyItems="center" 
                gap={4}
            >
                <Text 
                    className="title-styles" 
                    fontSize="md" fontWeight="bold"
                    color={ theme === "dark" ? "text" : "primary" }
                >
                    Your Queries
                </Text>
            </Box>
        </VStack>
    )
}
