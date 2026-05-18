import {
	HStack,
	Popover,
	Textarea,
	Spinner
} from "@chakra-ui/react";
import { LuSend } from "react-icons/lu";
import { memo, JSX, useContext } from "react";
import { ThemeContext } from "@/contexts/themeContext";
import { useChatInputController } from "@/hooks/useChatInputController";
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
		handleSendMessage
	} = useChatInputController();

	return (
		<Popover.Footer  
            borderTop="1px solid" 
            borderColor={isDark ? "variantDark" : "variantLight"}
            px={2} py={3}
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
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || isSending}
                    borderRadius="full" size="md"
                >
                    { !isSending ? <LuSend /> : <Spinner color={isDark ? "text" : "secondary"} /> }
                </IconButton>
            </HStack>
        </Popover.Footer>
	);
});

export default ChatInputBar;
