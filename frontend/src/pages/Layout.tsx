import { useState, JSX } from 'react';
import { Grid, GridItem } from '@chakra-ui/react';
import { FullScreen } from '@/components/FullScreen';
import { SideBar } from '@/components/SideBar';
import { Header } from '@/components/Header';
import { Chat } from '@/components/Chat'

function Layout(): JSX.Element {
	const [isSidebarOpened, setIsSidebarOpened] = useState<boolean>(false);

	return (
		<FullScreen>
			<Grid 
				w="100vw" h="100vh" 
				templateRows="60px 1fr"
      			templateColumns="minmax(60px, 250px) repeat(4, 1fr)"
				overflow="hidden"
			>
				<GridItem as="aside" rowSpan={2} colSpan={1}>
					<SideBar 
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
					maxH="calc(100vh - 60px)"
				>
					<Grid templateColumns="1fr 300px" h="100%">
						<GridItem as="section" colSpan={1}>
							{/* Map Session */}
						</GridItem>

						<GridItem as="section" colSpan={1}>
							<Chat />
						</GridItem>
					</Grid>
				</GridItem>
			</Grid>
		</FullScreen>
	);
}

export default Layout;
