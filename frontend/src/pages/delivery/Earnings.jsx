import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import "./Earnings.css";

const Earnings = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEarningsHistory = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get("/delivery/history");
            setHistory(res.data?.data || []);
        } catch (error) {
            console.error("Fetch earnings error:", error);
            toast.error("Failed to load delivery history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEarningsHistory();
    }, []);

    if (loading) {
        return <Loader message="Compiling delivery partner earnings history..." />;
    }

    const completedDeliveries = history.filter((h) => h.status === "delivered");
    const totalPayout = completedDeliveries.length * 40; // Flat ₹40 per delivery payout estimate
    const avgPayout = completedDeliveries.length > 0 ? totalPayout / completedDeliveries.length : 40;

    return (
        <div className="earnings-container">
            <h1 className="earnings-title">Delivery Partner Earnings & History</h1>

            {/* KPI Cards */}
            <div className="earnings-kpi-grid">
                <div className="earnings-kpi-card">
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: "600" }}>Total Completed Deliveries</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#111827" }}>{completedDeliveries.length}</div>
                </div>
                <div className="earnings-kpi-card">
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: "600" }}>Total Delivery Payout</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#16a34a" }}>₹{totalPayout.toFixed(2)}</div>
                </div>
                <div className="earnings-kpi-card">
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: "600" }}>Est. Avg Payout / Order</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#2563eb" }}>₹{avgPayout.toFixed(2)}</div>
                </div>
            </div>

            {/* History Table */}
            <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "1rem", color: "#111827" }}>
                Completed Deliveries Log
            </h2>

            {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: "12px", border: "1px dashed #ccc" }}>
                    <h3>No Completed Deliveries Yet</h3>
                    <p style={{ color: "#6b7280" }}>Your completed delivery history will appear here.</p>
                </div>
            ) : (
                <div className="history-table-container">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Pickup Shop</th>
                                <th>Customer</th>
                                <th>Payment Type</th>
                                <th>Payout Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((order) => (
                                <tr key={order._id}>
                                    <td><strong>#{order._id?.slice(-8).toUpperCase()}</strong></td>
                                    <td>{order.shop?.name || "Local Shop"}</td>
                                    <td>{order.customer?.username || "Customer"}</td>
                                    <td>
                                        <span style={{ fontWeight: "600", color: order.paymentMethod === "cod" ? "#dc2626" : "#2563eb" }}>
                                            {order.paymentMethod === "cod" ? "COD Cash" : "Online Paid"}
                                        </span>
                                    </td>
                                    <td><strong style={{ color: "#16a34a" }}>₹40.00</strong></td>
                                    <td>{new Date(order.updatedAt || order.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700", background: "#dcfce7", color: "#15803d" }}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Earnings;
