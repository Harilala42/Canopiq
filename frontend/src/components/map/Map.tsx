import { Box } from "@chakra-ui/react";
import { Chat } from "@/components/chat/";
import { useRef, useEffect, useMemo, JSX } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import { useGeoAnalysisSubscription } from "@/hooks/useGeoAnalysisSubscriptionController";
import useAnalyticsStore from "@/stores/useAnalyticsStore";
import useChatStore from "@/stores/useChatStore";
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

    return null
};

const Map = (): JSX.Element => {
    const currentMap = useAnalyticsStore((state) => state.location);
    const currentQuery = useChatStore((state) => state.currentQuery);

    useGeoAnalysisSubscription(currentQuery?.id);

    return (
        <Box w="100%" h="100%" maxH="calc(100vh - 60px)" position="relative">
            <MapContainer
                center={currentMap?.coords || [0, 0]}
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

                {currentMap && (
                    <>
                        <TileLayer url={currentMap.tileLayer} opacity={0.5} />

                        <MapEffects coords={currentMap.coords} />

                        <Marker position={currentMap.coords}>
                            <Popup>
                                Analysis Point: <br />
                                Lat: {currentMap.coords[0].toFixed(2)}, Lon:{" "}
                                {currentMap.coords[1].toFixed(2)} <br />
                                {currentMap.description}
                            </Popup>
                        </Marker>
                    </>
                )}
            </MapContainer>

            <Chat />
        </Box>
    );
};

export default Map;