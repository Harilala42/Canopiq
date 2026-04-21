import { useState, useEffect, JSX } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box } from '@chakra-ui/react';
import 'leaflet/dist/leaflet.css';

const Map = (): JSX.Element => {
    const [tileLayer, setTileLayer] = useState<string>('');
    const [coordinates, setCoordinates] = useState<[number, number]>([1.3540779, 103.7794401]);
    const [description, setDescription] = useState<string>('');

    useEffect(() => {
        // setCoordinates([1.35, 103.81]);
        setTileLayer("https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/9ed4b696859920764a821cb7549a4574-bfac25856f651233df9066f2ab850821/tiles/{z}/{x}/{y}");
        setDescription("Bukit Timah Nature Reserve, West Region, Singapore")
    }, []);

    return (
        <Box w="100%" h="100%" maxH="calc(100vh - 60px)" position="relative" overflow="hidden">
            <MapContainer 
                center={coordinates} 
                scrollWheelZoom={true}
                zoom={10} zoomControl={false}
                style={{ height: "100%", width: "100%" }}
            >
                {tileLayer && <TileLayer url={tileLayer} />}

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    opacity={0.5}
                />

                <Marker position={coordinates}>
                    <Popup>
                        Analysis Point: <br /> 
                        Lat: {coordinates[0].toFixed(2)}, Lon: {coordinates[1].toFixed(2)} <br /> 
                        Details: {description}
                    </Popup>
                </Marker>
            </MapContainer>
        </Box>
    );
};

export default Map;
