import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import "./CartSummary.css";

const CartSummary = ({ onCheckout, isCheckoutPage = false }) => {
    const { cart, cartCount } = useCart();

    const items = cart?.items || [];
    const subtotal = cart?.totalPrice || items.reduce((sum, item) => {
        const price = item.priceAtAdd || item.product?.price || 0;
        return sum + price * (item.quantity || 1);
    }, 0);

    const deliveryFee = subtotal > 0 ? (subtotal > 300 ? 0 : 30) : 0;
    const grandTotal = subtotal + deliveryFee;

    return (
        <div className="cart-summary-card">
            <h3 className="cart-summary-title">Order Summary</h3>

            <div className="cart-summary-row">
                <span>Items ({cartCount})</span>
                <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="cart-summary-row">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <strong style={{ color: "#16a34a" }}>FREE</strong> : `₹${deliveryFee}`}</span>
            </div>

            <div className="cart-summary-row total">
                <span>Total Amount</span>
                <span>₹{grandTotal.toFixed(2)}</span>
            </div>

            {!isCheckoutPage ? (
                <Link to="/checkout" className="checkout-btn">
                    Proceed to Checkout
                </Link>
            ) : (
                <button onClick={onCheckout} className="checkout-btn">
                    Place Order & Pay
                </button>
            )}
        </div>
    );
};

export default CartSummary;
