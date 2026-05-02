import { MapData } from '@/types/map';
import { Box } from '@chakra-ui/react';
import { supabase } from '@/utils/supabase';
import { useState, useEffect, JSX } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import useChatStore from '@/stores/useChatStore';
import Chat from '@/components/Chat';
import 'leaflet/dist/leaflet.css';

const RecenterMap = ({ coords }: { coords: [number, number] }) => {
    const map = useMap();
    
    useEffect(() => {
        map.flyTo(coords, 10);
    }, [coords, map]);

    return null;
};

const Map = (): JSX.Element => {
    const currentQuery = useChatStore((state) => state.currentQuery);
    const [map, setMap] = useState<MapData | null>(null);

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
                    const { gee_tile_url, location, center_point } = payload.new;
                    const newMap: MapData = {
                        tileLayer: gee_tile_url,
                        description: location,
                        coords: [center_point.coordinates[1], center_point.coordinates[0]]
                    };
                    
                    setMap(newMap);
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
                center={map?.coords || [0, 0]} 
                scrollWheelZoom={true}
                zoom={5} zoomControl={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {map && (<>
                    <TileLayer url={map.tileLayer} opacity={0.5} />

                    <RecenterMap coords={map.coords} />

                    <Marker position={map.coords}>
                        <Popup>
                            Analysis Point: <br /> 
                            Lat: {map.coords[0].toFixed(2)}, Lon: {map.coords[1].toFixed(2)} <br /> 
                            Details: {map.description}
                        </Popup>
                    </Marker>
                </>)}
            </MapContainer>

            <Chat />
        </Box>
    );
};

export default Map;
