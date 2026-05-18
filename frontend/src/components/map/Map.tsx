import { Box } from "@chakra-ui/react";
import { Chat } from "@/components/chat/";
import { useRef, useEffect, JSX } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import { useGeoAnalysisSubscription } from "@/hooks/useGeoAnalysisSubscriptionController";
import useAnalyticsStore from "@/stores/useAnalyticsStore";
import useChatStore from "@/stores/useChatStore";
import "leaflet/dist/leaflet.css";

const MapEffects = ({ coords }: { coords: [number, number] }) => { 
    const prevCoords = useRef<[number, number] | null>(null); 
    const map = useMap(); 
    
    useEffect(() => { 
        if (!coords) return; 
        
        if (prevCoords.current 
            && prevCoords.current[0] === coords[0] 
            && prevCoords.current[1] === coords[1]) 
            return; prevCoords.current = coords; 
            
        map.flyTo(coords, 10, { animate: true });
    }, [coords, map]); 
    
    return null; 
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
                        <TileLayer
                            url={currentMap.tileLayer}
                            opacity={0.5}
                        />

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