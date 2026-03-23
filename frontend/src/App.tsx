import { system } from "./theme";
import { Routes, Route } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { ProtectedRoute } from "@/pages/ProtectedRoute";
import { AlertProvider } from "@/contexts/alertContext";
import { AuthProvider } from "@/contexts/authContext";
import Register from "@/pages/Register";
import Layout from "@/pages/Layout";
import Login from "@/pages/Login";

function App() {
	return (
		<ChakraProvider value={system}>
			<AlertProvider>
				<AuthProvider>
					<Routes>
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route 
							element={
								<ProtectedRoute>
									<Layout />
								</ProtectedRoute>
							}
						>
							<Route path="/" element={<></>} />
						</Route>
					</Routes>
				</AuthProvider>
			</AlertProvider>
		</ChakraProvider>
	);
}

export default App;
