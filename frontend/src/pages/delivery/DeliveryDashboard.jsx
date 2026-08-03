import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import "./DeliveryDashboard.css";

const DeliveryDashboard = () => {
    const [isAvailable, setIsAvailable] = useState(true);
    const [assignedOrders, setAssignedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get("/delivery/assigned");
            setAssignedOrders(res.data?.data || []);
        } catch (error) {
            console.error("Fetch delivery error:", error);
            toast.error("Failed to load assigned delivery orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleToggleDuty = async () => {
        setToggling(true);
        try {
            const res = await axiosInstance.put("/delivery/toggle-availability", { isAvailable: !isAvailable });
            const updated = res.data?.data?.isAvailable ?? !isAvailable;
            setIsAvailable(updated);
            toast.success(`You are now ${updated ? "ONLINE (On Duty)" : "OFFLINE (Off Duty)"}`);
        } catch (error) {
            toast.error("Failed to update availability status");
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return <Loader message="Loading delivery partner portal..." />;
    }

    const activeOrder = assignedOrders.find((o) => o.status === "out_for_delivery" || o.status === "preparing" || o.status === "confirmed");

    return (
        <div className="delivery-dashboard-container">
            <div className="delivery-header">
                <div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: "800", margin: 0, color: "#111827" }}>
                        Delivery Partner Portal
                    </h1>
                    <p style={{ color: "#6b7280", margin: 0 }}>Accept and fulfill hyperlocal customer deliveries in real time.</p>
                </div>

                <div className="duty-status-toggle">
                    <span style={{ fontWeight: "700", color: isAvailable ? "#15803d" : "#b91c1c", fontSize: "0.9rem" }}>
                        DUTY STATUS: {isAvailable ? "ONLINE (ON DUTY)" : "OFFLINE"}
                    </span>
                    <div
                        className={`toggle-switch ${isAvailable ? "active" : ""}`}
                        onClick={!toggling ? handleToggleDuty : undefined}
                    >
                        <div className="toggle-circle" />
                    </div>
                </div>
            </div>

            {/* Delivery Stats */}
            <div className="delivery-stats-grid">
                <div className="delivery-stat-card">
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: "600" }}>Assigned Deliveries</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#2563eb" }}>{assignedOrders.length}</div>
                </div>
                <div className="delivery-stat-card">
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: "600" }}>Active Task</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#d97706" }}>{activeOrder ? "1 In Progress" : "None"}</div>
                </div>
                <div className="delivery-stat-card">
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: "600" }}>Today's Est. Earnings</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#16a34a" }}>₹{(assignedOrders.length * 40).toFixed(2)}</div>
                </div>
            </div>

            {/* Active Delivery Banner if any */}
            {activeOrder && (
                <div style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", color: "#fff", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <span style={{ background: "#fef08a", color: "#854d0e", fontWeight: "700", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", textTransform: "uppercase" }}>
                            ACTIVE DELIVERY IN PROGRESS
                        </span>
                        <h3 style={{ margin: "0.5rem 0 0.25rem 0" }}>Order #{activeOrder._id?.slice(-8).toUpperCase()}</h3>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: "0.9rem" }}>Pickup: {activeOrder.shop?.name} → Deliver: {activeOrder.deliveryAddress?.city}</p>
                    </div>
                    <Link to="/delivery/active" className="btn-start-delivery" style={{ background: "#ffffff", color: "#1e40af" }}>
                        🗺️ Go to Live Active Order Screen
                    </Link>
                </div>
            )}

            {/* Assigned Orders List */}
            <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "1rem", color: "#111827" }}>
                Assigned Delivery Tasks ({assignedOrders.length})
            </h2>

            {assignedOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: "12px", border: "1px dashed #ccc" }}>
                    <h3>No Assigned Orders Right Now</h3>
                    <p style={{ color: "#6b7280" }}>Stay online to receive new hyperlocal delivery assignments.</p>
                </div>
            ) : (
                assignedOrders.map((task) => (
                    <div key={task._id} className="delivery-task-card">
                        <div className="task-card-header">
                            <div>
                                <strong style={{ fontSize: "1.05rem", color: "#111827" }}>Order #{task._id?.slice(-8).toUpperCase()}</strong>
                                <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Shop: {task.shop?.name || "Local Store"}</div>
                            </div>
                            <span className={`order-status-badge ${task.status}`}>
                                {task.status.replace("_", " ")}
                            </span>
                        </div>

                        <div style={{ fontSize: "0.9rem", color: "#374151", marginBottom: "1rem" }}>
                            📍 <strong>Destination:</strong> {task.deliveryAddress?.addressLine}, {task.deliveryAddress?.city} ({task.deliveryAddress?.pincode})
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontWeight: "700", color: "#16a34a" }}>
                                Payout Est.: ₹40.00 {task.paymentMethod === "cod" ? "(Collect COD Cash)" : "(Paid Online)"}
                            </div>
                            <Link to="/delivery/active" className="btn-start-delivery">
                                Open Active Delivery →
                            </Link>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default DeliveryDashboard;
