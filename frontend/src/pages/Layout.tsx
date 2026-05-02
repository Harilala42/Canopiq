import { useState, useContext, lazy, Suspense, JSX } from 'react';
import { Grid, GridItem, Spinner, VStack } from '@chakra-ui/react';
import { ThemeContext } from '@/contexts/themeContext';
import { FullScreen } from '@/components/FullScreen';
import { Header } from '@/components/Header';
import SideBar from '@/components/SideBar';
import Chart from '@/components/Chart';

const Map = lazy(() => import('@/components/Map'));

function Layout(): JSX.Element {
	const [isSidebarOpened, setIsSidebarOpened] = useState<boolean>(false);
	const { theme } = useContext(ThemeContext);

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
				>
					<Grid templateColumns="repeat(4, 1fr)" h="100%">
						<GridItem as="section" colSpan={3}>
							<Suspense fallback={
								<VStack h="100%" justify="center">
									<Spinner color={theme === "dark" ? "text" : "secondary"} size="lg" />
								</VStack>
							}>
								<Map />
							</Suspense>
						</GridItem>

						<GridItem as="section" minW="300px" colSpan={1}>
							<Chart />
						</GridItem>
					</Grid>
				</GridItem>
			</Grid>
		</FullScreen>
	);
}

export default Layout;
