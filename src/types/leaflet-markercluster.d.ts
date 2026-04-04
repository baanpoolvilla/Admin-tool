import "leaflet";

declare module "leaflet" {
  interface MarkerClusterGroupOptions {
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    maxClusterRadius?: number;
    spiderfyDistanceMultiplier?: number;
    iconCreateFunction?: (cluster: MarkerCluster) => L.DivIcon | L.Icon;
  }

  interface MarkerCluster {
    getChildCount(): number;
  }

  interface MarkerClusterGroup extends L.FeatureGroup {
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
    clearLayers(): this;
  }

  function markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup;
}

declare module "leaflet.markercluster" {
  // augments leaflet namespace
}
