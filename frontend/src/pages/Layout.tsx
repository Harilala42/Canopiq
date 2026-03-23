import { JSX } from 'react';
import { Outlet } from "react-router-dom";
import { Box, Grid, GridItem } from '@chakra-ui/react';
import { FullScreen } from '@/components/FullScreen';

function Layout(): JSX.Element {

	return (
		<FullScreen bg="secondary">
			<></>
		</FullScreen>
	);
}

export default Layout;
