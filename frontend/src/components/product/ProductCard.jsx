import React from "react";
import { useCart } from "../../context/CartContext";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
    const { addItem, loading } = useCart();

    if (!product) return null;

    const {
        _id,
        name,
        price,
        discountPercent = 0,
        unit = "1 unit",
        images,
        stock = 10,
        isAvailable = true
    } = product;

    const imageUrl = images && images.length > 0
        ? (typeof images[0] === "string" ? images[0] : images[0]?.url)
        : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300";

    const effectivePrice = discountPercent > 0
        ? (price * (1 - discountPercent / 100)).toFixed(2)
        : price;

    const handleAddToCart = () => {
        addItem(_id, 1);
    };

    return (
        <div className="product-card">
            <div className="product-image-container">
                <img src={imageUrl} alt={name} className="product-image" />
                {discountPercent > 0 && (
                    <span className="product-discount-badge">{discountPercent}% OFF</span>
                )}
            </div>

            <div className="product-card-body">
                <h4 className="product-title">{name}</h4>
                <div className="product-unit">{unit}</div>

                <div className="product-price-section">
                    <span className="product-price">₹{effectivePrice}</span>
                    {discountPercent > 0 && (
                        <span className="product-original-price">₹{price}</span>
                    )}
                </div>

                <button
                    onClick={handleAddToCart}
                    disabled={loading || !isAvailable || stock <= 0}
                    className="product-add-btn"
                >
                    {!isAvailable || stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
