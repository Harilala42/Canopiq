import { JSX } from 'react';
import { Grid, GridItem } from '@chakra-ui/react';
import { FullScreen } from '@/components/FullScreen';
import { Header } from '@/components/Header';

function Layout(): JSX.Element {
	return (
		<FullScreen>
			<Grid 
				w="100vw" h="100vh" 
				templateRows="80px 1fr"
				templateColumns="repeat(4, 1fr)"
			>
				<GridItem rowSpan={1} colSpan={4}>
					<Header />
				</GridItem>

				<GridItem rowSpan={1} colSpan={4} display="flex" overflow="hidden">

				</GridItem>
			</Grid>
		</FullScreen>
	);
}

export default Layout;
