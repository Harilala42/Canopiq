import { useState, useContext, JSX } from 'react';
import { LuEye, LuEyeOff } from "react-icons/lu";
import { Field as FormikField } from 'formik';
import { 
    Box, 
    Input, 
    Field, 
    IconButton, 
    InputProps 
} from '@chakra-ui/react';
import { ThemeContext } from '@/contexts/themeContext';

interface RegisterInputProps extends InputProps
{
    name: string;
    label: string;
    type?: string;
    error?: string;
    isInvalid?: boolean;
    children?: React.ReactNode;
}

export const RegisterInput = ({ name, label, error, type="text", isInvalid=false, children, ...props }: RegisterInputProps): JSX.Element => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const currentType = (type != "password") ? "text" : (showPassword ? "text" : "password");
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    return (
        <Field.Root invalid={isInvalid}>
            <Box position="relative" w="full">
                <FormikField as={ Input }
                    className="peer text-styles" 
                    id={ name } name={ name } type={currentType}
                    bg={isDark ? "secondary" : "text"} 
                    borderColor={isDark ? "text" : "primary"} 
                    borderRadius="xl" h="50px" px="1rem" pt="1rem"
                    color={isDark ? "text" : "primary"}
                    transition="border-color 0.2s"
                    placeholder=" "
                    
                    _Canceled={{ borderColor: isDark ? "primary" : "secondary" }}
                    _focus={{ focusRing: "none", borderColor: "primary" }}
                    _invalid={{ borderColor: "red.500" }}
                    { ...props }
                />

                <Field.Label
                    className="text-styles" htmlFor={ name }
                    position="absolute" left="1rem" top="50%" 
                    color={isDark ? "text" : "primary"}
                    transform="translateY(-50%)"
                    transition="all 0.2s ease-out"
                    transformOrigin="left top" 
                    pointerEvents="none"
                    
                    _peerFocus={{
                        top: "0.5rem",
                        transform: "translateY(0) scale(0.8)",
                        color: isDark ? "primary" : "secondary"
                    }}
                    css={{
                        ".peer:not(:placeholder-shown) ~ &": {
                            top: "0.5rem",
                            transform: "translateY(0) scale(0.8)",
                            color: isDark ? "text" : "primary"
                        }
                    }}
                >{ label }
                </Field.Label>

                {/* Password Toggle Button */}
                {(type == "password") && (
                    <IconButton position="absolute" right="2" top="50%" transform="translateY(-50%)"
                        bgColor="transparent"
                        color={isDark ? "text" : "primary"}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-controls={name}
                    >
                        { showPassword ? <LuEyeOff /> : <LuEye />}
                    </IconButton>
                )}
            </Box>

            {isInvalid && (
                <Field.ErrorText className="text-styles" color="red.500" aria-live="polite">
                    { error }
                </Field.ErrorText>
            )}

            {children}
        </Field.Root>
    );
};