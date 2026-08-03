import React from "react";
import { Link } from "react-router-dom";
import "./ShopCard.css";

const ShopCard = ({ shop }) => {
    if (!shop) return null;

    const {
        _id,
        name,
        category,
        address,
        images,
        isOpen = true,
        distance,
        deliveryRadiusKm = 5,
        rating = 4.5
    } = shop;

    const imageUrl = images && images.length > 0
        ? (typeof images[0] === "string" ? images[0] : images[0]?.url)
        : "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=400";

    const formattedDistance = distance
        ? (distance > 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`)
        : null;

    return (
        <div className="shop-card">
            <div className="shop-card-image-wrapper">
                <img src={imageUrl} alt={name} className="shop-card-image" />
                <span className={`shop-status-badge ${isOpen ? "open" : "closed"}`}>
                    {isOpen ? "Open Now" : "Closed"}
                </span>
            </div>

            <div className="shop-card-content">
                <h3 className="shop-card-title">{name}</h3>
                <span className="shop-card-category">{category}</span>

                <div className="shop-card-details">
                    📍 {address?.addressLine || address?.city || "Local Area"}
                </div>

                <div className="shop-card-meta">
                    <span>⭐ {rating ? rating.toFixed(1) : "4.5"}</span>
                    {formattedDistance && <span className="shop-distance">🚗 {formattedDistance} away</span>}
                    <span>⚡ Radius: {deliveryRadiusKm}km</span>
                </div>

                <Link to={`/shops/${_id}`} className="shop-card-btn">
                    Visit Shop
                </Link>
            </div>
        </div>
    );
};

export default ShopCard;
