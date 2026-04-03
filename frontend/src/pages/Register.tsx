import useApi from '@/hooks/useAPI';
import logo from '@/assets/logo.svg';
import { useContext, JSX } from 'react';
import { AlertContext } from "@/contexts/alertContext";
import { ThemeContext } from "@/contexts/themeContext";
import { RegisterInput } from '@/components/RegisterInput';
import { Button } from '@/components/Button';
import { FullScreen } from '@/components/FullScreen';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field as FormikField } from 'formik';
import * as Yup from 'yup';
import {
	Box,
	Checkbox,
	Flex,
	Field,
	Heading,
	Stack,
	Text,
	Image,
	Link,
	VStack
} from '@chakra-ui/react';

interface RegisterFormData
{
    email: string;
	username: string;
    password: string;
    confirmPassword?: string;
    consent?: boolean;
}

const RegisterSchema: Yup.ObjectSchema<RegisterFormData> = Yup.object().shape({
	username: Yup.string()
		.required('Username is required'),
	email: Yup.string()
		.email('Invalid email address')
		.required('Email is required'),
	password: Yup.string()
		.required('Password is required')
		.min(10, 'Password must be at least 10 characters')
		.matches(
			/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{10,}$/,
			'Password must include an uppercase letter, a number, and a special character.'
		),
	confirmPassword: Yup.string()
		.required('Confirm Password is required')
		.oneOf([Yup.ref('password')], 'Passwords must match'),
  	consent: Yup.boolean()
		.oneOf([true], 'You must accept terms')
		.required('You have to agree with our Terms')
});

function Register(): JSX.Element {
	const navigate = useNavigate();
	const { isLoading, execute } = useApi<RegisterFormData>();
	const { showAlert } = useContext(AlertContext);
	const { theme } = useContext(ThemeContext);

	const handleRegister = async (formData: RegisterFormData) => {
		try {
			await execute({
				url: import.meta.env.VITE_API_AUTH_REGISTER,
				method: "POST",
				body: formData
			});

			showAlert(true, `Register successful! Welcome ${formData.username}.`);
			setTimeout(() => navigate('/login'), 2000);
		} catch (err: any) {
			const msgErr = err.message || "Registration failed! Please try again.";
			console.error("Failed to register:", err.message);
			showAlert(false, msgErr);
		}
	};

	return (
		<FullScreen>
			<Box w="full" maxW="350px">
				<Formik<RegisterFormData>
					initialValues={{
						username: '',
						email: '',
						password: '',
						confirmPassword: '',
						consent: false,
					}}
					validationSchema={RegisterSchema}
					onSubmit={handleRegister}
				>
					{({ errors, values, touched }) => (
						<Form>
							<Stack gap={4} align="center">
								<VStack gap={5} align="center">
									<Image src={logo} alt="Image, logo Canopiq" w="100px" />

									<Heading size="4xl" className="title-styles" color={theme === "dark" ? "text" : "primary"}>Register</Heading>
									<Text fontSize="lg" fontWeight="bold" className="text-styles" color={theme === "dark" ? "text" : "primary"}>Create your account</Text>
								</VStack>

								{/* Username Field */}
								<RegisterInput 
									label="Username" name="username" 
									isInvalid={!!errors.username && touched.username} 
									aria-label="Enter your username" maxLength={25}
									error={errors.username} 
								/>

								{/* Email Field */}
								<RegisterInput 
									label="Email" name="email"
									isInvalid={!!errors.email && touched.email} 
									aria-label="Enter your email" maxLength={50}
									error={errors.email} 
								/>

								{/* Password Field */}
								<RegisterInput 
									label="Password" name="password" type="password" 
									isInvalid={!!errors.password && touched.password} 
									aria-label="Enter your password" maxLength={30}
									error={errors.password} 
								>
									<Flex justify="flex-end" w="full" mt={1}>
										<Field.HelperText 
											className="text-styles" 
											fontSize="xs" fontWeight="bold" 
											color={theme === "dark" ? "primary" : "secondary"} 
											aria-live="polite"
										>
											{values.password.length} character(s)
										</Field.HelperText>
									</Flex>
								</RegisterInput>

								{/* Confirm Password Field */}
								<RegisterInput 
									label="Confirm Password"
									name="confirmPassword" type="password"
									isInvalid={!!errors.confirmPassword && touched.confirmPassword} 
									aria-label="Confirm your password" maxLength={30}
									error={errors.confirmPassword} 
								/>

								{/* Terms and Consent */}
								<FormikField name="consent">
									{({ field, form }: any) => {
										const isInvalid = !!form.errors.consent && form.touched.consent;

										return (
											<Field.Root invalid={isInvalid}>
												<Checkbox.Root
													id="consent"
													checked={field.value}
													onCheckedChange={(e) => form.setFieldValue("consent", !!e.checked)}
													size="lg" cursor="pointer"
													aria-label="You have to agree with our terms"
												>
													<Checkbox.HiddenInput />
													<Checkbox.Control 
														_checked={{ 
															bgColor: theme === "dark" ? "primary" : "secondary",
															color: theme === "dark" ? "secondary" : "text",
															border: "none" 
														}} 
														borderColor={theme === "dark" ? "text" : "primary"}
														_invalid={{ borderColor: "red.500", bgColor: "transparent" }}
														_hover={{ borderColor: theme === "dark" ? "primary" : "secondary" }}
													/>
													<Checkbox.Label className="title-styles" fontSize="md" fontWeight="500" color={theme === "dark" ? "text" : "primary"}>
														By signing up, you agree to Canopiq's{' '}
														<Link asChild fontWeight="bold"
															color={theme === "dark" ? "primary" : "secondary"}
															_hover={{ textDecoration: "underline" }}
															aria-label="Hyperlink to our Terms of Use"
														>
															<RouterLink to="/terms-of-use">Terms of Use</RouterLink>
														</Link>{' '}
														and{' '}
														<Link asChild fontWeight="bold"
															color={theme === "dark" ? "primary" : "secondary"}
															_hover={{ textDecoration: "underline" }}
															aria-label="Hyperlink to our Privacy Policy"
														>
															<RouterLink to="/privacy-policy">Privacy Policy</RouterLink>
														</Link>.
													</Checkbox.Label>
												</Checkbox.Root>
											</Field.Root>
										);
									}}
								</FormikField>

								{/* Submit Button */}
								<Button loading={isLoading} disabled={isLoading} aria-label="Register" h="50px">
									Register
								</Button>

								<Text className="title-styles" fontSize="md" fontWeight="medium" color={theme === "dark" ? "text" : "primary"}>
									Already have an account?{" "}
									<Link asChild 
										color={theme === "dark" ? "primary" : "secondary"}
										_hover={{ textDecoration: "underline" }}
										aria-label="Already have an account?"
										fontWeight="bold"
									>
										<RouterLink to="/login">Login!</RouterLink>
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

export default Register;
