import { MapData } from '@/types/map';
import { Box } from '@chakra-ui/react';
import { useEffect, useRef, JSX } from 'react';
import { supabase } from '@/utils/supabase.utils';
import { DatasetMetaData, LandCoverData, BiomeData } from "@/types/analysis";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import useAnalyticsStore from '@/stores/useAnalyticsStore';
import useChatStore from '@/stores/useChatStore';
import Chat from '@/components/Chat';
import 'leaflet/dist/leaflet.css';

const MapEffects = ({ coords }: { coords: [number, number] }) => {
    const prevCoords = useRef<[number, number] | null>(null);
    const map = useMap();

    useEffect(() => {
        if (!coords) return;

        if (prevCoords.current &&
            prevCoords.current[0] === coords[0] &&
            prevCoords.current[1] === coords[1])
            return;

        prevCoords.current = coords;
        map.flyTo(coords, 10, { animate: true });
    }, [coords, map]);

    return null;
};

const Map = (): JSX.Element => {
    const currentMap = useAnalyticsStore((state) => state.location);
    const currentQuery = useChatStore((state) => state.currentQuery);
    const setAnalyticsData = useAnalyticsStore((state) => state.setAnalyticsData);

    useEffect(() => {
        if (!currentQuery?.id) return;

        const channel = supabase
            .channel(`geo_analysis-${currentQuery.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'geo_analysis',
                    filter: `chat_id=eq.${currentQuery.id}`
                },
                (payload: any) => {
                    const { 
                        location,
                        dataset,
                        tile_layer_url,  
                        center_point,
                        start_year, end_year,
                        analytics
                    } = payload.new;

                    const newMap: MapData = {
                        description: location,
                        tileLayer: tile_layer_url,
                        coords: [
                            center_point.coordinates[1],
                            center_point.coordinates[0]
                        ]
                    };

                    const newDataset: DatasetMetaData = {
                        type: dataset,
                        legend: analytics.insights.metadata.legend,
                        description: analytics.insights.metadata.description,
                        source: analytics.insights.metadata.source,
                        unit: analytics.insights.metadata.unit
                    }

                    const newLandCover: LandCoverData = {
                        legend: analytics.land_cover.metadata.legend,
                        description: analytics.land_cover.metadata.description,
                        categories: (() => {
                            const biomeCategories: BiomeData[] = [];
                            for (const item in analytics.land_cover.distribution) {
                                const { color, percent } = analytics.land_cover.distribution[item];
                                biomeCategories.push({ category: item, color, percent });
                            }

                            return biomeCategories;
                        })(),
                        source: analytics.land_cover.metadata.source,
                        unit: analytics.land_cover.metadata.unit
                    }

                    setAnalyticsData({
                        location: newMap,
                        dataset: newDataset,
                        range_times: {
                            start: new Date(start_year).getFullYear(),
                            end: new Date(end_year).getFullYear()
                        },
                        area_coverage: analytics.stats.area_coverage_ha,
                        global_average: analytics.stats.global_average,
                        total_change: analytics.stats.total_change_percent,
                        dataset_time_series: analytics.insights.time_series,
                        land_cover: newLandCover
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentQuery?.id]);

    return (
        <Box w="100%" h="100%" maxH="calc(100vh - 60px)" position="relative" overflow="hidden">
            <MapContainer 
                center={currentMap?.coords || [0, 0]} 
                scrollWheelZoom={true}
                zoom={5} zoomControl={false}
                style={{ height: "100%", width: "100%" }}
            >
                <ZoomControl position="topright" />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {currentMap && (<>
                    <TileLayer url={currentMap.tileLayer} opacity={0.5} />

                    <MapEffects coords={currentMap.coords} />

                    <Marker position={currentMap.coords}>
                        <Popup>
                            Analysis Point: <br /> 
                            Lat: {currentMap.coords[0].toFixed(2)}, Lon: {currentMap.coords[1].toFixed(2)} <br /> 
                            Details: {currentMap.description}
                        </Popup>
                    </Marker>
                </>)}
            </MapContainer>

            <Chat />
        </Box>
    );
};

export default Map;
