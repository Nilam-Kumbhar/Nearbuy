import React from "react";
import LiveMap from "../../components/delivery/LiveMap";

const ActiveOrder = () => {
    // Demo position or live state
    const demoRiderPos = { lat: 19.0760, lng: 72.8777 };

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <h2>Active Delivery Order</h2>
            <p>Live map tracking and customer destination status.</p>
            <div style={{ marginTop: "1rem" }}>
                <LiveMap riderPosition={demoRiderPos} />
            </div>
        </div>
    );
};

export default ActiveOrder;
