import { useState, useEffect, JSX } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Box } from '@chakra-ui/react';
import { MapData } from '@/types/map';
import 'leaflet/dist/leaflet.css';

const RecenterMap = ({ coords }: { coords: [number, number] }) => {
    const map = useMap();
    
    useEffect(() => {
        map.flyTo(coords, 14);
    }, [coords, map]);

    return null;
};

const Map = (): JSX.Element => {
    const [map, setMap] = useState<MapData | null>(null);

    useEffect(() => {
        const newMap: MapData = {
            tileLayer: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/9409d16f35baeb36260c8792ccd15939-21760411c697e144c2d87f4f29e6e147/tiles/{z}/{x}/{y}",
            description: "Taman Nasional Kerinci Seblat, Jambi, Sumatera, Indonesia",
            coords: [-2.26, 101.35]
        };

        setMap(newMap);
    }, []);

    return (
        <Box w="100%" h="100%" maxH="calc(100vh - 60px)" position="relative" overflow="hidden">
            {map && (
                <MapContainer 
                    center={map.coords} 
                    scrollWheelZoom={true}
                    zoom={10} zoomControl={false}
                    style={{ height: "100%", width: "100%" }}
                >
                    {map.tileLayer && <TileLayer url={map.tileLayer} />}

                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        opacity={0.5}
                    />

                    <RecenterMap coords={map.coords} />

                    <Marker position={map.coords}>
                        <Popup>
                            Analysis Point: <br /> 
                            Lat: {map.coords[0].toFixed(2)}, Lon: {map.coords[1].toFixed(2)} <br /> 
                            Details: {map.description}
                        </Popup>
                    </Marker>
                </MapContainer>
            )}
        </Box>
    );
};

export default Map;
