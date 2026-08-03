import React from "react";
import { useParams } from "react-router-dom";

const ShopDetails = () => {
    const { id } = useParams();
    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <h2>Shop Details</h2>
            <p>Viewing details for shop ID: {id || "featured"}</p>
        </div>
    );
};

export default ShopDetails;
