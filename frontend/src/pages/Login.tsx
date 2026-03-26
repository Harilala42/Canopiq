import useApi from '@/hooks/useAPI';
import logo from '@/assets/logo.svg';
import googleLogo from '@/assets/googleLogo.svg';
import { useState, useContext, JSX } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { AlertContext } from "@/contexts/alertContext";
import { SubmitButton } from '@/components/SubmitButton';
import { Link as RouterLink } from 'react-router-dom';
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
import { LoginInput } from '@/components/LoginInput';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

interface LoginFormData
{
	email: string;
	password: string;
}

const LoginSchema: Yup.ObjectSchema<LoginFormData> = Yup.object().shape({
	email: Yup.string()
		.required('Email or Username is required'),
	password: Yup.string()
		.required('Password is Required')
});

function Login(): JSX.Element {
	const [isGoogleAuth, setIsGoogleAuth] = useState<boolean>(false);
	const { isLoading, execute } = useApi();
	const { showAlert } = useContext(AlertContext);
	const { login } = useContext(AuthContext);

	const handleLoginSubmit = async (formData: LoginFormData) => {
		try {
			
			showAlert(true, "Welcome back! You’re now logged in.");
		} catch (err: any) {
			showAlert(false, "Login failed! Please try Again.");
			console.error("Failed to login:", err.message);
		}
	};

	const handleGoogleAuth = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		setIsGoogleAuth(true);

		try {
			
		} catch(err: any) {
			showAlert(false, "Google sign-in failed! Please try again.");
			console.error("Failed to login with Google:", err.message);
		} finally {
			setIsGoogleAuth(false);
		}
	}

	return (
		<Flex minH="100vh" align="center" justify="center" bg="secondary" p={4}>
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

									<Heading size="4xl" className="title-styles">Login</Heading>
									<Text fontSize="lg" fontWeight="bold" className="text-styles">Access your account</Text>
								</VStack>

								{/* Email or Username Field */}
								<LoginInput
                                    name="email" type="text"
									label="Username or Email"
                                    placeholder="Enter your username or email"
									isInvalid={!!errors.email && touched.email}
									aria-label="Enter your username or email"
									error={errors.email} maxLength={50}
                                />

								{/* Password Field */}
								<LoginInput 
                                    name="password" type="password"
                                    label="Password" placeholder="Enter your password"
									isInvalid={!!errors.password && touched.password}
									aria-label="Enter your password" maxLength={30}
									error={errors.password}
                                >
									<Flex justify="flex-end" w="full" mt={1}>
                                        <Link asChild className="text-styles" fontSize="xs" fontWeight="bold" color="primary"
                                            _hover={{ textDecoration: "underline" }}
											aria-label="Forgot password?"
                                        >
                                            <RouterLink to="/">Forgot password?</RouterLink>
                                        </Link>
                                    </Flex>
                                </LoginInput>

								{/* Submit Button */}
								<SubmitButton 
									name="Login" 
									loading={isLoading && !isGoogleAuth} 
									disabled={isLoading && !isGoogleAuth}
									aria-label="Login"
								/>

								{/* Button to trigger Google Auth */}
								<Flex align="center" w="full" gap={4}>
									<Separator flex={1} borderColor="text" />
									<IconButton variant="outline" borderRadius="full" w="50px" h="50px" bg="secondary" borderColor="text"
										onClick={handleGoogleAuth} disabled={isGoogleAuth}
										aria-label="Authenticate via Google account"
										_hover={{ bg: "text" }}
									>
										{ !isGoogleAuth ? <Image src={googleLogo} alt="Image, Google Logo" w="24px" /> : <Spinner color="primary" size="sm" /> }
									</IconButton>
									<Separator flex={1} borderColor="text" />
								</Flex>

								<Text className="title-styles" fontSize="md" fontWeight="medium">
									Not a member yet?{" "}
									<Link asChild color="primary"
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
		</Flex>
	);
}

export default Login;
