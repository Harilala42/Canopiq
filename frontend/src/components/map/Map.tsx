import { 
    MapContainer, 
    TileLayer, 
    Marker, 
    Popup, 
    ZoomControl, 
    GeoJSON, 
    Tooltip, 
    useMap 
} from "react-leaflet";
import { Box } from "@chakra-ui/react";
import { Chat } from "@/components/chat/";
import { useRef, useEffect, JSX } from "react";
import { useMapController } from "@/hooks/useMapController";
import "leaflet/dist/leaflet.css";

const getHexStyle = (feature: any) => {
    return {
        fillColor: feature.properties?.color || "#b2773f",
        weight: 1,
        opacity: 0.8,
        color: "#1a202c",
        fillOpacity: 0.55
    };
};

const onEachHexagon = (feature: any, layer: any) => {
    layer.on({
        mouseover: (e: any) => {
            const polygon = e.target;
            polygon.setStyle({
                fillOpacity: 0.8,
                weight: 0,
                color: "#ffffff"
            });
        },
        mouseout: (e: any) => {
            const polygon = e.target;
            polygon.setStyle(getHexStyle(feature));
        }
    });
};

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
    const { map, coords, location } = useMapController();

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
                    <GeoJSON
                        key={`h3-grid-${map.features[0]?.id || 'empty'}`}
                        data={map}
                        style={getHexStyle}
                        onEachFeature={onEachHexagon}
                    />
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
        </Box>
    );
};

export default Map;