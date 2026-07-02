export interface HexProperties
{
    color: string;
    hex_id: string;
    biomass?: number;
    dominant_class?: string;
}

export interface GeoJSONFeature {
    type: "Feature";
    id: string;
    bbox?: [number, number, number, number];
    geometry: {
        type: "Polygon";
        coordinates: number[][][];
    };
    properties: HexProperties;
}

export interface HexGeoJSONData {
    type: "FeatureCollection";
    bbox?: [number, number, number, number];
    features: GeoJSONFeature[];
}

export interface LegendData
{
    color: string;
    label: string;
}

export interface GridMap
{
    id: string;
    location: string;
    coords: [number, number];
    hex_geojson: HexGeoJSONData;
    legend: LegendData[];
}
