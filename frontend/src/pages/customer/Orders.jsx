import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import DeliveryTrackingMap from "../../components/delivery/DeliveryTrackingMap";
import toast from "react-hot-toast";
import "./Orders.css";

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trackingOrderId, setTrackingOrderId] = useState(null);

    const fetchMyOrders = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get("/orders/my-orders");
            setOrders(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyOrders();
    }, []);

    if (loading) {
        return <Loader message="Loading your order history..." />;
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="orders-container">
                <div className="orders-empty-state">
                    <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📦</div>
                    <h2>No Orders Found</h2>
                    <p style={{ color: "#6b7280", margin: "0.5rem 0 1.5rem 0" }}>You haven't placed any orders yet.</p>
                    <Link to="/" style={{ background: "#2563eb", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "8px", textDecoration: "none", fontWeight: "600" }}>
                        Explore Shops & Order Now
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-container">
            <h1 className="orders-title">My Orders History</h1>

            {/* Tracking Modal if active */}
            {trackingOrderId && (
                <div style={{ marginBottom: "2rem", background: "#fff", padding: "1.5rem", borderRadius: "12px", border: "2px solid #2563eb", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h3 style={{ margin: 0, color: "#111827" }}>Live Map Tracking for Order #{trackingOrderId.slice(-6)}</h3>
                        <button onClick={() => setTrackingOrderId(null)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "0.3rem 0.75rem", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}>
                            Close Map
                        </button>
                    </div>
                    <DeliveryTrackingMap orderId={trackingOrderId} />
                </div>
            )}

            {orders.map((order) => {
                const status = order.status || "pending";
                const isTrackable = status === "out_for_delivery" || status === "processing" || status === "confirmed";

                return (
                    <div key={order._id} className="order-card">
                        <div className="order-card-header">
                            <div>
                                <div className="order-id">Order #{order._id?.slice(-8).toUpperCase()}</div>
                                <div className="order-date">
                                    Shop: <strong>{order.shop?.name || "Local Shop"}</strong> | Date: {new Date(order.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <span className={`order-status-badge ${status}`}>
                                {status.replace("_", " ")}
                            </span>
                        </div>

                        <div className="order-items-list">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="order-item-row">
                                    <img
                                        src={item.product?.images?.[0]?.url || item.product?.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=100"}
                                        alt={item.product?.name || "Product"}
                                        className="order-item-image"
                                    />
                                    <div style={{ flex: 1 }}>
                                        <strong style={{ color: "#111827" }}>{item.product?.name || "Product"}</strong>
                                        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Quantity: {item.quantity}</div>
                                    </div>
                                    <div style={{ fontWeight: "600" }}>
                                        ₹{((item.price || item.product?.price || 0) * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="order-card-footer">
                            <div className="order-total-price">
                                Total: ₹{(order.grandTotal || order.totalAmount || 0).toFixed(2)}
                            </div>
                            {isTrackable && (
                                <button
                                    onClick={() => setTrackingOrderId(order._id)}
                                    className="track-delivery-btn"
                                >
                                    🗺️ Live Track Order
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Orders;
