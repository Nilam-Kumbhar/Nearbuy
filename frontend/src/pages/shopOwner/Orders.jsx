import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import "./Orders.css";

const STATUS_FILTERS = [
    { label: "All Orders", value: "all" },
    { label: "Pending Acceptance", value: "pending" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Preparing", value: "preparing" },
    { label: "Out for Delivery", value: "out_for_delivery" },
    { label: "Delivered", value: "delivered" },
    { label: "Rejected / Cancelled", value: "rejected" }
];

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const [updatingId, setUpdatingId] = useState(null);

    const fetchShopOrders = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get("/orders/shop-orders");
            setOrders(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch shop orders:", error);
            toast.error("Failed to load shop orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShopOrders();
    }, []);

    const handleUpdateStatus = async (orderId, newStatus) => {
        setUpdatingId(orderId);
        try {
            const res = await axiosInstance.put(`/orders/status/${orderId}`, { status: newStatus });
            toast.success(`Order status updated to "${newStatus.replace("_", " ")}"`);
            setOrders(orders.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
        } catch (error) {
            console.error("Update order status error:", error);
            toast.error(error.response?.data?.message || "Failed to update order status");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return <Loader message="Loading incoming customer orders..." />;
    }

    const filteredOrders = orders.filter((order) => {
        if (activeFilter === "all") return true;
        if (activeFilter === "rejected") return order.status === "rejected" || order.status === "cancelled";
        return order.status === activeFilter;
    });

    return (
        <div className="shop-orders-container">
            <h1 className="shop-orders-title">Manage Customer Orders</h1>

            {/* Filter Tabs */}
            <div className="order-filter-tabs">
                {STATUS_FILTERS.map((tab) => (
                    <button
                        key={tab.value}
                        className={`filter-tab ${activeFilter === tab.value ? "active" : ""}`}
                        onClick={() => setActiveFilter(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {filteredOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: "12px", border: "1px dashed #ccc" }}>
                    <h3>No orders found</h3>
                    <p style={{ color: "#6b7280" }}>There are currently no orders in this status category.</p>
                </div>
            ) : (
                filteredOrders.map((order) => {
                    const status = order.status || "pending";
                    const isBusy = updatingId === order._id;

                    return (
                        <div key={order._id} className="shop-order-card">
                            <div className="shop-order-header">
                                <div>
                                    <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#111827" }}>
                                        Order #{order._id?.slice(-8).toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.2rem" }}>
                                        Customer: <strong>{order.customer?.username || "Local Customer"}</strong> | Phone: {order.customer?.phone || "N/A"}
                                    </div>
                                </div>
                                <span className={`order-status-badge ${status}`}>
                                    {status.replace("_", " ")}
                                </span>
                            </div>

                            <div style={{ fontSize: "0.9rem", color: "#374151", marginBottom: "1rem" }}>
                                📍 <strong>Delivery Address:</strong> {order.deliveryAddress?.addressLine}, {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}
                            </div>

                            {/* Order Items */}
                            <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "1rem", marginBottom: "1.25rem" }}>
                                <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                                    Ordered Items
                                </div>
                                {order.items?.map((item, idx) => (
                                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.95rem" }}>
                                        <span>{item.product?.name || "Product"} × <strong>{item.quantity}</strong></span>
                                        <span style={{ fontWeight: "600" }}>₹{((item.price || item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "0.5rem", marginTop: "0.5rem", display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "1.05rem" }}>
                                    <span>Total Grand Amount</span>
                                    <span style={{ color: "#2563eb" }}>₹{(order.grandTotal || order.totalAmount || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Action Buttons for Shop Owner */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                                {status === "pending" && (
                                    <>
                                        <button
                                            disabled={isBusy}
                                            onClick={() => handleUpdateStatus(order._id, "confirmed")}
                                            className="btn-accept-order"
                                        >
                                            {isBusy ? "Accepting..." : "✓ Accept Order"}
                                        </button>
                                        <button
                                            disabled={isBusy}
                                            onClick={() => handleUpdateStatus(order._id, "rejected")}
                                            className="btn-reject-order"
                                        >
                                            {isBusy ? "Rejecting..." : "✗ Reject Order"}
                                        </button>
                                    </>
                                )}

                                {status === "confirmed" && (
                                    <button
                                        disabled={isBusy}
                                        onClick={() => handleUpdateStatus(order._id, "preparing")}
                                        className="btn-update-status"
                                    >
                                        🍳 Mark as Preparing
                                    </button>
                                )}

                                {status === "preparing" && (
                                    <button
                                        disabled={isBusy}
                                        onClick={() => handleUpdateStatus(order._id, "out_for_delivery")}
                                        className="btn-update-status"
                                    >
                                        🚴 Dispatch / Out for Delivery
                                    </button>
                                )}

                                {status === "out_for_delivery" && (
                                    <button
                                        disabled={isBusy}
                                        onClick={() => handleUpdateStatus(order._id, "delivered")}
                                        className="btn-update-status"
                                        style={{ background: "#16a34a" }}
                                    >
                                        ✅ Mark as Delivered
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default Orders;
