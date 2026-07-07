import { memo, JSX, useContext } from "react";
import { LuSend, LuSquare } from "react-icons/lu";
import { HStack, Textarea, Box } from "@chakra-ui/react";
import { useChatInputController } from "@/hooks/useChatInputController";
import { ThemeContext } from "@/contexts/themeContext";
import { IconButton } from "@/components/IconButton";

const ChatInputBar = memo((): JSX.Element => {
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

	const {
		textareaRef,
		inputValue,
		setInputValue,
		isSending,
		isLoading,
        isCanceling,
        hasRunningJob,
		handleSendMessage,
        handleCancelAnalysis
	} = useChatInputController();

	return (
        <Box 
            w="100%" px={2} py={5}
            borderTop="1px solid" 
            borderColor={isDark ? "variantDark" : "variantLight"}
        >
            <HStack
                bg={isDark ? "variantDark" : "variantLight"} 
                borderRadius={15} overflow="hidden"
                w="100%" p={1}
            >
                <Textarea
                    ref={textareaRef}
                    value={inputValue} 
                    placeholder="Ask Canopiq" 
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}

                    className="text-styles" 
                    minH="36px" maxH="100px"
                    resize="none" maxLength={1000}
                    border="none" rows={1} pt={2} pb={2}
                    color={isDark ? "text" : "secondary"}
                    _placeholder={{ 
                        fontFamily: "FiraCode", 
                        color: isDark ? "text" : "secondary", 
                        opacity: 0.8
                    }}
                    _focus={{ focusRing: "none" }}
                />

                <IconButton 
                    aria-label="Send Message" 
                    onClick={hasRunningJob ? handleCancelAnalysis : handleSendMessage}
                    disabled={
                        isSending || isCanceling ||
                        (isLoading && !hasRunningJob) ||
                        (!hasRunningJob && !inputValue.trim())
                    }
                    color={isDark ? "text" : "text"}
                    bg={isDark ? "primary" : "secondary"}
                    borderRadius={15} size="md"
                >
                    { hasRunningJob ? <LuSquare /> : <LuSend /> }
                </IconButton>
            </HStack>
        </Box>
	);
});

export default ChatInputBar;
