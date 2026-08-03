import React from "react";
import { useCart } from "../../context/CartContext";

const Cart = () => {
    const { cartItems, cartCount, clearCart } = useCart();
    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <h2>Shopping Cart ({cartCount} items)</h2>
            {cartItems.length === 0 ? (
                <p>Your cart is currently empty.</p>
            ) : (
                <div>
                    <ul>
                        {cartItems.map((item, idx) => (
                            <li key={idx}>
                                {item.product?.name || "Product"} - Qty: {item.quantity}
                            </li>
                        ))}
                    </ul>
                    <button onClick={clearCart}>Clear Cart</button>
                </div>
            )}
        </div>
    );
};

export default Cart;
