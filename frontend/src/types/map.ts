export interface GeoJSONFeature {
    type: "Feature";
    id: string;
    bbox?: [number, number, number, number];
    geometry: {
        type: "Polygon";
        coordinates: number[][][];
    };
    properties: {
        color: string;
        hex_id: string;
        biomass: number;
    };
}

export interface HexGeoJSONData {
    type: "FeatureCollection";
    bbox?: [number, number, number, number];
    features: GeoJSONFeature[];
}
