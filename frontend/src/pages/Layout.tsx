import { useState, JSX } from 'react';
import { Grid, GridItem } from '@chakra-ui/react';
import { FullScreen } from '@/components/FullScreen';
import { SlideBar } from '@/components/SlideBar';
import { Header } from '@/components/Header';

function Layout(): JSX.Element {
	const [isSidebarOpened, setIsSidebarOpened] = useState<boolean>(false);

	return (
		<FullScreen>
			<Grid 
				w="100vw" h="100vh" 
				templateRows="50px 1fr"
      			templateColumns="minmax(60px, 250px) repeat(4, 1fr)"
			>
				<GridItem as="aside" rowSpan={2} colSpan={1}>
					<SlideBar 
						isExpanded={isSidebarOpened}
            			onToggle={() => setIsSidebarOpened(prev => !prev)}
					/>
				</GridItem>

				<GridItem 
					as="header" 
					rowSpan={1} colSpan={4} 
					ml={!isSidebarOpened ? "-200px" : "none"} 
					h="60px"
				>
					<Header />
				</GridItem>

				<GridItem 
					as="main" 
					rowSpan={1} colSpan={4}
					ml={!isSidebarOpened ? "-200px" : "none"}
				>

				</GridItem>
			</Grid>
		</FullScreen>
	);
}

export default Layout;
