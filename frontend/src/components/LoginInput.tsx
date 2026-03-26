import { useState } from 'react';
import { 
    Box, 
    Input, 
    IconButton, 
    Field,
    InputProps 
} from "@chakra-ui/react";
import { Field as FormikField } from 'formik';
import { LuEye, LuEyeOff } from "react-icons/lu";

interface LoginInputProps extends InputProps
{
    name: string;
    label: string;
    type?: string;
    error?: string;
    isInvalid?: boolean;
    children?: React.ReactNode;
}

export const LoginInput = ({ name, label, error, type="text", isInvalid=false, children, ...props }: LoginInputProps) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const currentType = (type != "password") ? "text" : (showPassword ? "text" : "password");

    return (
        <Field.Root invalid={isInvalid} w="full">
            <Field.Label className="text-styles" htmlFor={ name } fontWeight="bold">
                { label }
            </Field.Label>
            
            <Box position="relative" w="full">
                <FormikField bg="secondary" className="text-styles" borderColor="text" borderRadius="xl" h="50px" color="text"
                    as={Input}
                    name={name} id={name} type={currentType}
                    _placeholder={{ fontFamily: "FiraCode", color: "text", opacity: 0.8 }}
                    _focus={{ focusRing: "none", borderColor: "primary" }}
                    _invalid={{ borderColor: "red.500" }}
                    _hover={{ borderColor: "primary" }}
                    {...props}
                />

                {/* Password Toggle Button */}
                {(type == "password") && (
                    <IconButton position="absolute" right="2" top="50%" transform="translateY(-50%)"
                        bgColor="transparent" color="white"
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
                </Field.ErrorText>)
            }

            {children}
        </Field.Root>
    );
};

export default LoginInput;