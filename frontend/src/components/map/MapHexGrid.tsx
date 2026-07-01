import useAnalyticsStore from "@/stores/useAnalyticsStore";
import { HexGeoJSONData, HexProperties } from "@/types/map";
import type { LeafletMouseEvent, Layer } from "leaflet";
import type { Feature, Geometry } from "geojson";
import { GeoJSON } from "react-leaflet";
import { useMemo, memo } from "react";

type HexFeature = Feature<Geometry, HexProperties>;

interface HexagonalMapProps
{
    mapData: HexGeoJSONData;
}

const MapHexGrid = memo(({ mapData }: HexagonalMapProps) => {
    const currentAnalysis = useAnalyticsStore((state) => state.activeAnalysis);
    const meta = currentAnalysis ? currentAnalysis.analytics.metadata : null;

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
            layer.bindTooltip(
                `${meta?.legend}: \
                ${Math.max(0, feature.properties?.biomass).toFixed(2)} \
                ${meta?.unit}`,
                {
                    sticky: true,
                    direction: "top",
                    opacity: 0.9
                }
            );

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
            key={`h3-grid-${mapData.features[0].id}-${mapData.features.length}`}
            data={mapData}
            style={getHexStyle}
            onEachFeature={onEachHexagon}
        />
    );
});

export default MapHexGrid;
