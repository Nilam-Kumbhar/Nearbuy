import React from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LiveMap.css";

// Fix for default Leaflet marker icon breaking silently under Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const LiveMap = ({ riderPosition }) => {
    if (!riderPosition || typeof riderPosition.lat !== "number" || typeof riderPosition.lng !== "number") {
        return (
            <div className="live-map-waiting">
                Waiting for rider location…
            </div>
        );
    }

    const center = [riderPosition.lat, riderPosition.lng];

    return (
        <div className="live-map-wrapper">
            <MapContainer
                center={center}
                zoom={15}
                className="live-map-container"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={center} />
            </MapContainer>
        </div>
    );
};

export default LiveMap;
