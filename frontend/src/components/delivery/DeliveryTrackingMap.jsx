import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom Leaflet marker icons using standard CDN icons
const deliveryRiderIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972531.png",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

const destinationIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});

// Helper component to center map on rider position updates
const ChangeMapView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] !== 0 && center[1] !== 0) {
            map.flyTo(center, map.getZoom(), { animate: true });
        }
    }, [center, map]);
    return null;
};

const DeliveryTrackingMap = ({
    orderId,
    customerLocation = [19.0760, 72.8777], // Default Mumbai coords [lat, lng]
    serverUrl = "http://localhost:8000"
}) => {
    const [riderLocation, setRiderLocation] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        if (!orderId) return;

        // Connect to Socket.IO backend
        const socket = io(serverUrl, {
            withCredentials: true,
            transports: ["websocket", "polling"]
        });

        socket.on("connect", () => {
            console.log("Connected to live tracking socket:", socket.id);
            setIsConnected(true);

            // Join order-specific room
            socket.emit("joinOrderRoom", { orderId });
        });

        // Listen for live location updates from delivery partner
        socket.on("location:update", (data) => {
            console.log("Live location update received:", data);
            if (data && data.latitude && data.longitude) {
                setRiderLocation([data.latitude, data.longitude]);
                setLastUpdated(new Date().toLocaleTimeString());
            }
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from live tracking socket");
            setIsConnected(false);
        });

        return () => {
            socket.emit("leaveOrderRoom", { orderId });
            socket.disconnect();
        };
    }, [orderId, serverUrl]);

    // Active position: rider position if available, fallback to customer destination
    const currentPosition = riderLocation || customerLocation;

    return (
        <div style={{ width: "100%", height: "400px", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
            <div
                style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    zIndex: 1000,
                    background: "rgba(255, 255, 255, 0.95)",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                }}
            >
                <span
                    style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: isConnected ? "#22c55e" : "#ef4444"
                    }}
                />
                {isConnected ? (riderLocation ? "Live Tracking Active" : "Waiting for Rider Location...") : "Offline"}
                {lastUpdated && <span style={{ opacity: 0.7, fontWeight: "normal" }}>({lastUpdated})</span>}
            </div>

            <MapContainer
                center={currentPosition}
                zoom={14}
                style={{ width: "100%", height: "100%" }}
                scrollWheelZoom={true}
            >
                {/* OpenStreetMap Tile Layer */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ChangeMapView center={currentPosition} />

                {/* Customer Destination Marker */}
                {customerLocation && (
                    <Marker position={customerLocation} icon={destinationIcon}>
                        <Popup>Delivery Destination</Popup>
                    </Marker>
                )}

                {/* Live Rider Location Marker */}
                {riderLocation && (
                    <Marker position={riderLocation} icon={deliveryRiderIcon}>
                        <Popup>
                            <strong>Delivery Partner</strong>
                            <br />
                            Live location on the way to you!
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default DeliveryTrackingMap;
