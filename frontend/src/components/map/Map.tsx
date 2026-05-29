import { 
    MapContainer, 
    TileLayer, 
    Marker, 
    Popup, 
    ZoomControl, 
    useMap
} from "react-leaflet";
import { Box } from "@chakra-ui/react";
import { useRef, useEffect, JSX } from "react";
import { useMapController } from "@/hooks/useMapController";
import { MapHexGrid, MapLegend } from "@/components/map/";
import { Chat } from "@/components/chat/";
import "leaflet/dist/leaflet.css";

const MapEffects = ({ coords }: { coords: [number, number] }) => { 
    const prevRef = useRef<[number, number] | null>(null);
    const map = useMap();

    useEffect(() => {
        if (!coords) return;

        if (!prevRef.current) {
            prevRef.current = coords;
            map.flyTo(coords, 10);
            return;
        }

        const [lat1, lon1] = prevRef.current;
        const [lat2, lon2] = coords;

        const moved = Math.hypot(lat1 - lat2, lon1 - lon2);

        if (moved > 0.01) {
            map.flyTo(coords, 10);
            prevRef.current = coords;
        }
    }, [coords, map]);

    return null;
};

const Map = (): JSX.Element => {
    const { 
        map, 
        coords, 
        location,
        legend
    } = useMapController();

    return (
        <Box w="100%" h="100%" maxH="calc(100vh - 60px)" position="relative">
            <MapContainer
                center={coords || [0, 0]}
                scrollWheelZoom
                zoom={5}
                zoomControl={false}
                style={{ height: "100%", width: "100%" }}
            >
                <ZoomControl position="topright" />

                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {map && map.features && map.features.length > 0 && (
                    <MapHexGrid mapData={map} />
                )}

                {coords && (
                    <>
                        <MapEffects coords={coords} />

                        <Marker position={coords}>
                            <Popup>
                                Analysis Point: <br />
                                Lat: {coords[0].toFixed(2)}, Lon:{" "}
                                {coords[1].toFixed(2)} <br />
                                {location}
                            </Popup>
                        </Marker>
                    </>
                )}
            </MapContainer>

            <Chat />

            {legend && (
                <MapLegend legend={legend} />
            )}
        </Box>
    );
};

export default Map;