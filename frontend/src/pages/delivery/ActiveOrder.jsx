import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import LiveMap from "../../components/delivery/LiveMap";
import StatusTracker from "../../components/delivery/StatusTracker";
import useSocket from "../../hooks/useSocket";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import "./ActiveOrder.css";

const ActiveOrder = () => {
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [riderPosition, setRiderPosition] = useState({ lat: 19.0760, lng: 72.8777 });

    const orderId = order?._id;
    const { emitLocationUpdate, isConnected } = useSocket(orderId);

    // Fetch current active assigned order
    const fetchActiveOrder = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get("/delivery/assigned");
            const assigned = res.data?.data || [];
            const active = assigned.find((o) => o.status === "out_for_delivery" || o.status === "preparing" || o.status === "confirmed") || assigned[0];
            setOrder(active || null);
        } catch (error) {
            console.error("Fetch active order error:", error);
            toast.error("Failed to load active delivery task");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveOrder();
    }, []);

    // Watch rider position & broadcast via Socket.IO
    useEffect(() => {
        if (!orderId) return;

        let watchId;
        if ("geolocation" in navigator) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setRiderPosition({ lat, lng });

                    // Broadcast to socket room
                    emitLocationUpdate({
                        orderId,
                        latitude: lat,
                        longitude: lng,
                        heading: pos.coords.heading || 0,
                        speed: pos.coords.speed || 0
                    });

                    // Update live location in DB periodically
                    axiosInstance.put("/delivery/location", { latitude: lat, longitude: lng }).catch(() => { });
                },
                (err) => console.error("Geolocation watch error:", err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
            );
        }

        return () => {
            if (watchId !== undefined && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [orderId, emitLocationUpdate]);

    const handleUpdateStatus = async (newStatus) => {
        if (!orderId) return;
        setUpdating(true);
        try {
            const res = await axiosInstance.put(`/delivery/status/${orderId}`, { status: newStatus });
            toast.success(`Order status updated to "${newStatus.replace("_", " ")}"`);
            setOrder({ ...order, status: newStatus });

            if (newStatus === "delivered") {
                toast.success("Delivery completed successfully! 🎉");
                setTimeout(() => navigate("/delivery/dashboard"), 1500);
            }
        } catch (error) {
            console.error("Status update error:", error);
            toast.error(error.response?.data?.message || "Failed to update delivery status");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <Loader message="Loading active delivery map & task..." />;
    }

    if (!order) {
        return (
            <div className="active-order-container" style={{ textAlign: "center", padding: "4rem 2rem" }}>
                <h2>No Active Delivery Task</h2>
                <p style={{ color: "#6b7280", margin: "0.5rem 0 1.5rem 0" }}>You currently have no active delivery orders in progress.</p>
                <button onClick={() => navigate("/delivery/dashboard")} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "0.75rem 1.5rem", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const currentStatus = order.status || "confirmed";

    return (
        <div className="active-order-container">
            <h1 className="active-order-title">
                Active Order Fulfill: #{order._id?.slice(-8).toUpperCase()}
            </h1>

            {/* Status Timeline */}
            <StatusTracker currentStatus={currentStatus} />

            <div className="active-order-grid">
                <div className="active-order-main">
                    {/* Real-time Map */}
                    <div style={{ marginBottom: "1.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                            <span style={{ fontWeight: "700", color: "#111827" }}>Live Delivery Navigation Map</span>
                            <span style={{ fontSize: "0.8rem", color: isConnected ? "#16a34a" : "#ef4444", fontWeight: "700" }}>
                                {isConnected ? "⚡ Socket Broadcaster Connected" : "Connecting Socket..."}
                            </span>
                        </div>
                        <LiveMap riderPosition={riderPosition} />
                    </div>

                    {/* Order Items Summary */}
                    <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem" }}>Items to Pick Up & Deliver</h3>
                        {order.items?.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid #f3f4f6" }}>
                                <span>{item.product?.name || "Product"} × <strong>{item.quantity}</strong></span>
                                <span style={{ fontWeight: "600" }}>₹{((item.price || item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar: Details & Actions */}
                <div className="active-order-sidebar">
                    <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.2rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "0.5rem" }}>
                        Delivery Details
                    </h3>

                    <div className="order-detail-group">
                        <label>Pickup Store</label>
                        <strong style={{ color: "#111827" }}>{order.shop?.name || "Neighborhood Store"}</strong>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{order.shop?.address?.addressLine || "Local Shop Location"}</div>
                    </div>

                    <div className="order-detail-group">
                        <label>Customer Destination</label>
                        <strong style={{ color: "#111827" }}>{order.customer?.username || "Customer"}</strong>
                        <div style={{ fontSize: "0.85rem", color: "#374151" }}>
                            📍 {order.deliveryAddress?.addressLine}, {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#2563eb", marginTop: "0.25rem", fontWeight: "600" }}>
                            📞 Phone: {order.customer?.phone || "N/A"}
                        </div>
                    </div>

                    <div className="order-detail-group">
                        <label>Payment Method & Cash to Collect</label>
                        <div style={{ fontSize: "1.1rem", fontWeight: "800", color: order.paymentMethod === "cod" ? "#dc2626" : "#16a34a" }}>
                            {order.paymentMethod === "cod" ? `Collect ₹${(order.grandTotal || order.totalAmount || 0).toFixed(2)} CASH` : "Online Paid (No Cash Collection)"}
                        </div>
                    </div>

                    {/* Delivery Partner Action Buttons */}
                    {currentStatus !== "out_for_delivery" && currentStatus !== "delivered" && (
                        <button
                            disabled={updating}
                            onClick={() => handleUpdateStatus("out_for_delivery")}
                            className="btn-status-action pickup"
                        >
                            {updating ? "Updating..." : "🚴 Pick Up Order & Start Delivery"}
                        </button>
                    )}

                    {currentStatus === "out_for_delivery" && (
                        <button
                            disabled={updating}
                            onClick={() => handleUpdateStatus("delivered")}
                            className="btn-status-action complete"
                        >
                            {updating ? "Completing..." : "✅ Mark Delivery as Completed"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActiveOrder;
