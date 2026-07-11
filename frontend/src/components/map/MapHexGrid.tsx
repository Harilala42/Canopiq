import useAnalyticsStore from "@/stores/useAnalyticsStore";
import { GeoJSONFeature, HexGeoJSONData, HexProperties } from "@/types/map";
import type { LeafletMouseEvent, Layer } from "leaflet";
import type { Feature, Geometry } from "geojson";
import { GeoJSON } from "react-leaflet";
import { cellToBoundary } from "h3-js";
import { useMemo, memo } from "react";

type HexFeature = Feature<Geometry, HexProperties>;

interface HexagonalMapProps
{
    mapData: HexProperties[];
}

const MapHexGrid = memo(({ mapData }: HexagonalMapProps) => {
    const currentAnalysis = useAnalyticsStore((state) => state.activeAnalysis);
    const meta = currentAnalysis ? currentAnalysis.analytics.metadata : null;

    const GeoJSONMap: HexGeoJSONData = useMemo(() => {
        const features = mapData.map((cell): GeoJSONFeature => {
            const coords = cellToBoundary(cell.hex_id, true);
            
            return {
                type: "Feature",
                id: cell.hex_id,
                geometry: {
                    type: "Polygon",
                    coordinates: [coords] 
                },
                properties: cell
            };
        });

        return {
            type: "FeatureCollection",
            features
        };
    }, [mapData]);

    const getHexStyle = useMemo(() => {
        return (feature: HexFeature) => {
            return {
                weight: 1,
                opacity: 0.8,
                color: "#1a1535",
                fillColor: feature.properties?.color,
                fillOpacity: 0.5
            };
        };
    }, []);

    const onEachHexagon = useMemo(() => {
        return (feature: HexFeature, layer: Layer) => {
            let tooltipText = "feature.properties?.dominant_class";
            
            if (meta?.type === "land_use_distribution") {
                const landUseClass = feature.properties?.class || "Unknown Land Cover";
                tooltipText = `Class: ${landUseClass}`;
            } else {
                const biomassValue = Math.max(0, feature.properties?.percent || 0).toFixed(2);
                tooltipText = `${meta?.legend || "Value"}: ${biomassValue} ${meta?.unit || ""}`;
            }

            layer.bindTooltip(tooltipText, {
                sticky: true,
                direction: "top",
                opacity: 0.9
            });

            layer.on({
                mouseover: (e: LeafletMouseEvent) => {
                    const polygon = e.target;
                    polygon.setStyle({
                        weight: 0,
                        color: "#AFA9EC",
                        fillOpacity: 0.8
                    });
                },
                mouseout: (e: LeafletMouseEvent) => {
                    const polygon = e.target;
                    polygon.setStyle(getHexStyle(feature));
                }
            });
        }
    }, [currentAnalysis]);

    return (
        <GeoJSON
            key={`h3-grid-${GeoJSONMap.features[0].id}-${GeoJSONMap.features.length}`}
            data={GeoJSONMap}
            style={getHexStyle}
            onEachFeature={onEachHexagon}
        />
    );
});

export default MapHexGrid;
