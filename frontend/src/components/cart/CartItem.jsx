import React from "react";
import { useCart } from "../../context/CartContext";
import "./CartItem.css";

const CartItem = ({ item }) => {
    const { updateQuantity, removeItem } = useCart();

    if (!item) return null;

    const product = item.product || {};
    const productId = product._id || item.product;
    const quantity = item.quantity || 1;
    const price = item.priceAtAdd || product.price || 0;

    const imageUrl = product.images && product.images.length > 0
        ? (typeof product.images[0] === "string" ? product.images[0] : product.images[0]?.url)
        : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150";

    const handleIncrement = () => {
        updateQuantity(productId, quantity + 1);
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            updateQuantity(productId, quantity - 1);
        } else {
            removeItem(productId);
        }
    };

    const handleRemove = () => {
        removeItem(productId);
    };

    return (
        <div className="cart-item">
            <img src={imageUrl} alt={product.name || "Product"} className="cart-item-image" />
            <div className="cart-item-info">
                <h4 className="cart-item-title">{product.name || "Product"}</h4>
                <div className="cart-item-price">₹{price} × {quantity} = <strong>₹{(price * quantity).toFixed(2)}</strong></div>
            </div>
            <div className="cart-item-actions">
                <button onClick={handleDecrement} className="qty-btn">-</button>
                <span className="qty-count">{quantity}</span>
                <button onClick={handleIncrement} className="qty-btn">+</button>
                <button onClick={handleRemove} className="remove-item-btn">Remove</button>
            </div>
        </div>
    );
};

export default CartItem;
