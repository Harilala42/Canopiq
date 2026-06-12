export interface HexProperties
{
    color: string;
    hex_id: string;
    biomass: number;
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
    range: string;
}

export interface MapData
{
    map_id: string;
    hex_geojson: HexGeoJSONData;
    legend: LegendData[];
}
