import logo from '@/assets/logo.svg';
import googleIcon from '@/assets/googleIcon.svg';
import { useState, useContext, useCallback, JSX } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
	Box,
	Flex, 
	Heading, 
	IconButton, 
	Image,
	Stack,
	VStack,
	Text,
	Separator,
	Link,
	Spinner
} from "@chakra-ui/react";
import { AuthContext } from '@/contexts/authContext';
import { AlertContext } from "@/contexts/alertContext";
import { ThemeContext } from '@/contexts/themeContext';
import { FullScreen } from '@/components/FullScreen';
import { FormInput } from '@/components/FormInput';
import { Button } from '@/components/Button';
import { LoginFormData } from '@/types/auth';
import { AuthAPI } from '@/api/auth.api';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

const LoginSchema: Yup.ObjectSchema<LoginFormData> = Yup.object().shape({
	email: Yup.string()
		.required('Email or Username is required'),
	password: Yup.string()
		.required('Password is Required')
});

function Login(): JSX.Element {
	const navigate = useNavigate();
	const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
	const [isGoogleAuth, setIsGoogleAuth] = useState<boolean>(false);
	const { showAlert } = useContext(AlertContext);
	const { theme } = useContext(ThemeContext);
	const { login } = useContext(AuthContext);
	const isDark = theme === "dark";

	const handleLoginSubmit = useCallback(async (formData: LoginFormData) => {
		setIsLoggingIn(true);

		try {
			await AuthAPI.loginWithPassword(formData)

			await login();
			showAlert(true, "Welcome back! You’re now logged in.");
			setTimeout(() => navigate('/'), 2000);
		} catch (err: any) {
			const msgErr = err.message || "Login failed! Please try Again.";
			console.error("Failed to login:", err.message);
			showAlert(false, msgErr);
		} finally {
            setIsLoggingIn(false);
        }
	}, []);

	const handleGoogleAuth = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		setIsGoogleAuth(true);

		try {
			window.location.href = AuthAPI.getGoogleAuthUrl();
		} catch(err: any) {
			showAlert(false, "Google sign-in failed! Please try again.");
			console.error("Failed to login with Google:", err.message);
		}
	}, []);

	return (
		<FullScreen>
			<Box w="full" maxW="350px">
				<Formik<LoginFormData>
					initialValues={{ email: '', password: '' }}
					validationSchema={LoginSchema}
					onSubmit={handleLoginSubmit}
				>
					{({ errors, touched }) => (
						<Form>
							<Stack gap={5} align="center">
								<VStack gap={5} align="center">
									<Image src={logo} alt="Image, logo Canopiq" w="100px" />

									<Heading size="4xl" className="title-styles" color={isDark ? "text" : "primary"}>Login</Heading>
									<Text fontSize="lg" fontWeight="bold" className="text-styles" color={isDark ? "text" : "primary"}>Access your account</Text>
								</VStack>

								{/* Email or Username Field */}
								<FormInput
                                    name="email" label="Email"
									isInvalid={!!errors.email && touched.email}
									aria-label="Enter your username or email"
									error={errors.email} maxLength={50}
                                />

								{/* Password Field */}
								<FormInput 
                                    name="password" label="Password" type="password"
									isInvalid={!!errors.password && touched.password}
									aria-label="Enter your password" maxLength={30}
									error={errors.password}
                                >
									<Flex justify="flex-end" w="full" mt={1}>
                                        <Link asChild className="text-styles" fontSize="xs" fontWeight="bold" color={isDark ? "primary" : "secondary"}
                                            _hover={{ textDecoration: "underline" }}
											aria-label="Forgot password?"
                                        >
                                            <RouterLink to="/">Forgot password?</RouterLink>
                                        </Link>
                                    </Flex>
                                </FormInput>

								{/* Submit Button */}
								<Button 
									loading={isLoggingIn && !isGoogleAuth} 
									disabled={isLoggingIn || isGoogleAuth} 
									aria-label="Login" h="50px"
								>
									Login
								</Button>

								{/* Button to trigger Google Auth */}
								<Flex align="center" w="full" gap={4}>
									<Separator flex={1} borderColor={ isDark ? "text" : "primary" } />
									<IconButton 
										w="50px" h="50px" 
										variant="outline" borderRadius="full" 
										bg={isDark ? "secondary" : "text"} 
										borderColor={ isDark ? "text" : "primary" }
										onClick={handleGoogleAuth} 
										disabled={isGoogleAuth || isLoggingIn}
										aria-label="Authenticate via Google account"
										_hover={{ bg: isDark ? "text" : "primary" }}
									>
										{ !isGoogleAuth ? <Image src={googleIcon} alt="Image, Google Logo" w="24px" /> : <Spinner color={isDark ? "primary" : "secondary"} size="sm" /> }
									</IconButton>
									<Separator flex={1} borderColor={ isDark ? "text" : "primary" } />
								</Flex>

								<Text className="title-styles" fontSize="md" fontWeight="medium" color={isDark ? "text" : "primary"}>
									Not a member yet?{" "}
									<Link asChild
										color={isDark ? "primary" : "secondary"}
										_hover={{ textDecoration: "underline" }}
										aria-label="Not a member yet ?"
										fontWeight="bold"
									>
										<RouterLink to="/register">Register!</RouterLink>
									</Link>
								</Text>
							</Stack>
						</Form>
					)}
				</Formik>
			</Box>
		</FullScreen>
	);
}

export default Login;
