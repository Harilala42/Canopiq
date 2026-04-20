import { useState, useEffect, JSX } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Box } from '@chakra-ui/react';
import 'leaflet/dist/leaflet.css';

const Map = (): JSX.Element => {
    const [tileLayer, setTileLayer] = useState<string>('');
    const [coordinates, setCoordinates] = useState<[number, number]>([1.35, 103.81]);

    useEffect(() => {
        setCoordinates([1.35, 103.81]);
        setTileLayer("https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/d09e35c8d703c664791304347dd44ec8-eda600ee2210c3abdaa6426a4a0768dc/tiles/{z}/{x}/{y}");
    }, []);

    return (
        <Box w="100%" h="100%" maxH="calc(100vh - 60px)" position="relative" overflow="hidden">
            <MapContainer 
                center={coordinates} 
                scrollWheelZoom={true}
                zoom={10} zoomControl={false}
                style={{ height: "100%", width: "100%" }}
            >
                { tileLayer && <TileLayer url={tileLayer} /> }

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    opacity={0.5}
                />
            </MapContainer>
        </Box>
    );
};

export default Map;
