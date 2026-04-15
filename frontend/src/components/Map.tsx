import { JSX } from 'react';
import { Box } from '@chakra-ui/react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const Map = (): JSX.Element => {
    const position: [number, number] = [0, 0];

    return (
        <Box w="100%" h="100%" maxH="calc(100vh - 60px)" position="relative" overflow="hidden">
            <MapContainer 
                center={position} 
                scrollWheelZoom={true}
                zoom={5} zoomControl={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            </MapContainer>
        </Box>
    );
}
