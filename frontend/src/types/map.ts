export interface HexProperties
{
    hex_id: string;
    color: string;
    percent?: number;
    class?: string;
}

export interface GeoJSONFeature {
    type: "Feature";
    id: string;
    geometry: {
        type: "Polygon";
        coordinates: number[][][];
    };
    properties: HexProperties;
}

export interface HexGeoJSONData {
    type: "FeatureCollection";
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
    h3_cells: HexProperties[];
    legend: LegendData[];
}
