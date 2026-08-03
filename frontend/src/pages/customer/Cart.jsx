import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import CartItem from "../../components/cart/CartItem";
import CartSummary from "../../components/cart/CartSummary";
import Loader from "../../components/common/Loader";
import "./Cart.css";

const Cart = () => {
    const { cartItems, cartCount, loading, clearCart } = useCart();

    if (loading && cartItems.length === 0) {
        return <Loader message="Loading your shopping cart..." />;
    }

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="cart-page-container">
                <div className="cart-empty-view">
                    <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added any products to your cart yet.</p>
                    <Link to="/" className="browse-shops-btn">
                        Explore Nearby Shops
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page-container">
            <h1 className="cart-page-title">Your Shopping Cart</h1>

            <div className="cart-layout">
                <div className="cart-items-section">
                    <div className="cart-items-header">
                        <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "#374151" }}>
                            Items in Cart ({cartCount})
                        </span>
                        <button onClick={clearCart} className="clear-cart-btn">
                            Clear Cart
                        </button>
                    </div>

                    {cartItems.map((item, index) => (
                        <CartItem key={item.product?._id || item.product || index} item={item} />
                    ))}
                </div>

                <div>
                    <CartSummary />
                </div>
            </div>
        </div>
    );
};

export default Cart;
