import { useContext, JSX } from 'react';
import { Outlet } from "react-router-dom";
import { Box, Button, Grid, GridItem } from '@chakra-ui/react';
import { FullScreen } from '@/components/FullScreen';
import { AuthContext } from '@/contexts/authContext';

function Layout(): JSX.Element {
	const { logout } = useContext(AuthContext);

	return (
		<FullScreen bg="secondary">
			<Button className="text-styles" bg="primary" onClick={logout}>Log out</Button>
		</FullScreen>
	);
}

export default Layout;
