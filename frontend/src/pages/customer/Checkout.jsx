import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import axiosInstance from "../../api/axiosInstance";
import CartSummary from "../../components/cart/CartSummary";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import "./Checkout.css";

// Helper function to dynamically load Razorpay Checkout SDK script
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const Checkout = () => {
    const { user } = useAuth();
    const { cart, cartItems, fetchCart } = useCart();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("online");
    const [deliveryAddress, setDeliveryAddress] = useState({
        addressLine: "",
        city: "",
        pincode: "",
        phone: user?.phone || "",
        notes: ""
    });
    const [coords, setCoords] = useState(null); // { lat, lng }
    const [locating, setLocating] = useState(true);
 

    useEffect(() => {
        loadRazorpayScript();
    }, []);

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            toast.error("Geolocation is not supported by your browser. We need your location to deliver your order.");
            setLocating(false);
            return;
        }
 
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocating(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast.error("Unable to get your location. Please enable location access to place an order.");
                setLocating(false);
            }
        );
    }, []);

    const handleChange = (e) => {
        setDeliveryAddress({ ...deliveryAddress, [e.target.name]: e.target.value });
    };

    const handleCheckout = async () => {
        if (!deliveryAddress.addressLine || !deliveryAddress.city || !deliveryAddress.pincode) {
            toast.error("Please fill in all required delivery address fields");
            return;
        }

        if (!cartItems || cartItems.length === 0) {
            toast.error("Your cart is empty");
            return;
        }

        if (!coords) {
            toast.error("We need your delivery location to place the order. Please enable location access and try again.");
            return;
        }

        setLoading(true);
        try {
            // 1. Place order on backend
            const orderPayload = {
                deliveryAddress: {
                    addressLine: deliveryAddress.addressLine,
                    city: deliveryAddress.city,
                    pincode: deliveryAddress.pincode,
                    location: {
                        type: "Point",
                        coordinates: [coords.lng, coords.lat] // GeoJSON order: [longitude, latitude]
                    }
                },
                paymentMethod: paymentMethod === "online" ? "online" : "cod"
            };

            const placeOrderRes = await axiosInstance.post("/orders/place", orderPayload);
            const createdOrder = placeOrderRes.data?.data;

            if (!createdOrder || !createdOrder._id) {
                throw new Error("Failed to create order");
            }

            const orderId = createdOrder._id;

            // 2. Handle Cash on Delivery
            if (paymentMethod === "cod") {
                toast.success("Order placed successfully with Cash on Delivery!");
                await fetchCart();
                navigate("/orders");
                return;
            }

            // 3. Handle Razorpay Online Payment
            const resLoaded = await loadRazorpayScript();
            if (!resLoaded) {
                toast.error("Razorpay SDK failed to load. Please check your connection.");
                setLoading(false);
                return;
            }

            // Initialize Razorpay order on backend
            const checkoutRes = await axiosInstance.post("/payments/checkout", { orderId });
            const rzpData = checkoutRes.data?.data;

            if (!rzpData || !rzpData.razorpayOrderId) {
                throw new Error("Failed to initialize Razorpay checkout");
            }

            const options = {
                key: rzpData.keyId || "rzp_test_placeholder",
                amount: rzpData.amount,
                currency: rzpData.currency || "INR",
                name: "Nearbuy Hyperlocal",
                description: `Payment for Order #${orderId.slice(-6)}`,
                order_id: rzpData.razorpayOrderId,
                handler: async function (response) {
                    try {
                        await axiosInstance.post("/payments/success", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId
                        });
                        toast.success("Payment verified and order confirmed!");
                        await fetchCart();
                        navigate("/orders");
                    } catch (verifyError) {
                        console.error("Payment verification failed:", verifyError);
                        toast.error("Payment verification failed");
                    }
                },
                modal: {
                    ondismiss: async function () {
                        toast.error("Payment cancelled");
                        try {
                            await axiosInstance.post("/payments/failure", {
                                razorpay_order_id: rzpData.razorpayOrderId,
                                orderId,
                                failureReason: "User closed Razorpay payment modal"
                            });
                        } catch (e) {
                            console.error("Failure log error:", e);
                        }
                    }
                },
                prefill: {
                    name: user?.username || "",
                    email: user?.email || "",
                    contact: deliveryAddress.phone || "9999999999"
                },
                theme: {
                    color: "#2563eb"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Checkout process error:", error);
            toast.error(error.message || error.response?.data?.message || "Checkout failed");
        } finally {
            setLoading(false);
        }
    };

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="checkout-container" style={{ textAlign: "center", padding: "4rem 2rem" }}>
                <h2>Your cart is empty</h2>
                <p style={{ color: "#6b7280", margin: "1rem 0 1.5rem 0" }}>Add items to your cart before proceeding to checkout.</p>
                <Link to="/" style={{ background: "#2563eb", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "8px", textDecoration: "none", fontWeight: "600" }}>
                    Browse Shops
                </Link>
            </div>
        );
    }

    return (
        <div className="checkout-container">
            <h1 className="checkout-title">Checkout & Place Order</h1>

            {loading && <Loader fullScreen message="Processing your order & payment..." />}

            <div className="checkout-layout">
                <div className="checkout-form-card">
                    {/* Delivery Address Form */}
                    <h2 className="checkout-section-heading">1. Delivery Address</h2>
                    <div className="form-group">
                        <label className="form-label">Street Address / House No.</label>
                        <input
                            type="text"
                            name="addressLine"
                            value={deliveryAddress.addressLine}
                            onChange={handleChange}
                            placeholder="e.g. 102, Green Park Apartments, MG Road"
                            required
                            className="form-input"
                        />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="form-group">
                            <label className="form-label">City</label>
                            <input
                                type="text"
                                name="city"
                                value={deliveryAddress.city}
                                onChange={handleChange}
                                placeholder="e.g. Mumbai"
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Pincode</label>
                            <input
                                type="text"
                                name="pincode"
                                value={deliveryAddress.pincode}
                                onChange={handleChange}
                                placeholder="e.g. 400001"
                                required
                                className="form-input"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone Number for Delivery Updates</label>
                        <input
                            type="text"
                            name="phone"
                            value={deliveryAddress.phone}
                            onChange={handleChange}
                            placeholder="e.g. 9876543210"
                            className="form-input"
                        />
                    </div>

                    {/* Payment Method Selector */}
                    <h2 className="checkout-section-heading" style={{ marginTop: "2rem" }}>
                        2. Payment Option
                    </h2>
                    <div className="payment-methods">
                        <label className={`payment-option ${paymentMethod === "online" ? "selected" : ""}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="online"
                                checked={paymentMethod === "online"}
                                onChange={() => setPaymentMethod("online")}
                            />
                            <div>
                                <div className="payment-title">💳 Online Payment (Razorpay)</div>
                                <div className="payment-desc">Pay securely using UPI, Credit/Debit Cards, NetBanking, or Wallets</div>
                            </div>
                        </label>

                        <label className={`payment-option ${paymentMethod === "cod" ? "selected" : ""}`}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="cod"
                                checked={paymentMethod === "cod"}
                                onChange={() => setPaymentMethod("cod")}
                            />
                            <div>
                                <div className="payment-title">💵 Cash on Delivery (COD)</div>
                                <div className="payment-desc">Pay cash to delivery rider upon receipt of order</div>
                            </div>
                        </label>
                    </div>
                </div>

                <div>
                    <CartSummary 
                        onCheckout={handleCheckout} 
                        isCheckoutPage={true} 
                        checkoutDisabled={locating || !coords}
                        checkoutButtonLabel={locating ? "Locating you..." : (!coords ? "Enable location to continue" : "Place Order & Pay")}
                    />
                </div>
            </div>
        </div>
    );
};

export default Checkout;
