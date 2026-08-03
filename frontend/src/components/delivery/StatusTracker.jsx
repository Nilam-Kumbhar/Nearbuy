import React from "react";
import "./StatusTracker.css";

const STEPS = [
    { key: "pending", label: "Order Placed", icon: "📝" },
    { key: "confirmed", label: "Store Confirmed", icon: "🏪" },
    { key: "preparing", label: "Preparing Items", icon: "🍳" },
    { key: "out_for_delivery", label: "Out for Delivery", icon: "🚴" },
    { key: "delivered", label: "Delivered", icon: "✅" }
];

const StatusTracker = ({ currentStatus = "pending" }) => {
    // Determine active index
    let activeIndex = 0;
    if (currentStatus === "confirmed") activeIndex = 1;
    if (currentStatus === "preparing") activeIndex = 2;
    if (currentStatus === "out_for_delivery") activeIndex = 3;
    if (currentStatus === "delivered") activeIndex = 4;
    if (currentStatus === "cancelled" || currentStatus === "rejected") activeIndex = -1;

    if (activeIndex === -1) {
        return (
            <div className="status-tracker-container" style={{ borderColor: "#fca5a5", background: "#fef2f2" }}>
                <div style={{ color: "#b91c1c", fontWeight: "700", textAlign: "center" }}>
                    ❌ Order Status: {currentStatus.toUpperCase()}
                </div>
            </div>
        );
    }

    return (
        <div className="status-tracker-container">
            <div className="status-tracker-title">Order Status Timeline</div>

            <div className="tracker-steps">
                {STEPS.map((step, index) => {
                    const isCompleted = index < activeIndex;
                    const isActive = index === activeIndex;

                    return (
                        <div
                            key={step.key}
                            className={`tracker-step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                        >
                            <div className="step-circle">
                                {isCompleted ? "✓" : step.icon}
                            </div>
                            <div className="step-label">{step.label}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StatusTracker;
