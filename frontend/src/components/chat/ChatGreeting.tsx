import {
	VStack,
	Text,
	Image
} from "@chakra-ui/react";
import dark from "@/assets/darkEarth.svg";
import light from "@/assets/lightEarth.svg";
import { memo, JSX, useContext } from "react";
import { ThemeContext } from "@/contexts/themeContext";
import { AuthContext } from "@/contexts/authContext";
import { motion } from "framer-motion";

const ChatGreeting = memo((): JSX.Element => {
	const { user } = useContext(AuthContext);

	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	return (
		<VStack h="100%" align="center" justify="center" gap={5} flex={1}>
            <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
            >
                <Image src={theme !== "dark" ? dark : light} w="150px" alt="Welcome Earth Icon" />
            </motion.div>

            <VStack align="center">
                <Text className="titles-styles" color={isDark ? "text" : "secondary"} fontSize="sm" fontWeight="bold">
                    Hi {user.username}
                </Text>
                
                <Text className="text-styles" color={isDark ? "text" : "secondary"} fontSize="md">
                    Where should we start? 
                </Text>
            </VStack>
        </VStack>
	);
});

export default ChatGreeting;
