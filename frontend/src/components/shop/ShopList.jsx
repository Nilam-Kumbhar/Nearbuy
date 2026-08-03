import React from "react";
import ShopCard from "./ShopCard";
import Loader from "../common/Loader";
import "./ShopList.css";

const ShopList = ({ shops = [], loading = false, emptyMessage = "No shops found nearby." }) => {
    if (loading) {
        return <Loader message="Finding nearby shops..." />;
    }

    if (!shops || shops.length === 0) {
        return (
            <div className="shop-list-empty">
                <h3>No Shops Found</h3>
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="shop-list-grid">
            {shops.map((shop) => (
                <ShopCard key={shop._id} shop={shop} />
            ))}
        </div>
    );
};

export default ShopList;
