import { useState, useContext, lazy, Suspense, JSX } from 'react';
import { Grid, GridItem, Spinner, VStack } from '@chakra-ui/react';
import { ThemeContext } from '@/contexts/themeContext';
import { FullScreen } from '@/components/FullScreen';
import { Chart } from '@/components/analytics/';
import { SideBar } from '@/components/sidebar';
import { Header } from '@/components/Header';
import useChatStore from '@/stores/useChatStore';

const Map = lazy(() => import('@/components/map/Map'));

function Layout(): JSX.Element {
	const [isChartOpen, setIsChartOpen] = useState<boolean>(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
	const currentQuery = useChatStore((state) => state.currentQuery);
	const { theme } = useContext(ThemeContext);
	const isDark = theme === "dark";

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
						isExpanded={isSidebarOpen}
            			onToggle={() => setIsSidebarOpen(prev => !prev)}
					/>
				</GridItem>

				<GridItem 
					as="header" 
					rowSpan={1} colSpan={4} 
					ml={!isSidebarOpen ? "-200px" : "none"} 
					h="60px"
				>
					<Header />
				</GridItem>

				<GridItem 
					as="main" 
					rowSpan={1} colSpan={4}
					ml={!isSidebarOpen ? "-200px" : "none"}
				>
					<Grid 
						templateColumns={
							!currentQuery
							? "repeat(3, 4fr)"
							: isChartOpen 
							? "repeat(3, 1fr) 400px" 
							: "repeat(3, 1fr) 50px"
						} 
						transition="grid-template-columns 0.3s ease-in-out"
						h="100%"
					>
						<GridItem as="section" colSpan={currentQuery ? 3 : 4}>
							<Suspense fallback={
								<VStack h="100%" justify="center">
									<Spinner color={isDark ? "text" : "secondary"} size="lg" />
								</VStack>
							}>
								<Map />
							</Suspense>
						</GridItem>

						{currentQuery && (
							<GridItem as="section" colSpan={1}>
								<Chart 
									isOpen={isChartOpen} 
									onToggle={() => setIsChartOpen(prev => !prev)}
								/>
							</GridItem>
						)}
					</Grid>
				</GridItem>
			</Grid>
		</FullScreen>
	);
}

export default Layout;
