import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState({ items: [], shop: null, totalPrice: 0 });
    const [loading, setLoading] = useState(false);

    // Total quantity of items in the cart
    const cartCount = cart?.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;

    // Fetch user's cart from backend
    const fetchCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCart({ items: [], shop: null, totalPrice: 0 });
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.get("/cart");
            const cartData = response.data?.data;
            if (cartData) {
                setCart(cartData);
            }
        } catch (error) {
            console.error("Failed to fetch cart:", error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Fetch cart on authentication change
    useEffect(() => {
        if (isAuthenticated) {
            fetchCart();
        } else {
            setCart({ items: [], shop: null, totalPrice: 0 });
        }
    }, [isAuthenticated, fetchCart]);

    // Add item to cart (syncs with POST /cart/add)
    const addItem = async (productId, quantity = 1, forceClear = false) => {
        if (!isAuthenticated) {
            toast.error("Please login to add items to your cart");
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.post("/cart/add", {
                productId,
                quantity,
                forceClear
            });

            const updatedCart = response.data?.data;
            if (updatedCart) {
                setCart(updatedCart);
                toast.success("Item added to cart!");
            }
            return response.data;
        } catch (error) {
            const errResponse = error.response?.data;
            const message = errResponse?.message || "Failed to add item to cart";
            toast.error(message);
            throw errResponse || error;
        } finally {
            setLoading(false);
        }
    };

    // Remove item from cart (syncs with DELETE /cart/:id)
    const removeItem = async (productId) => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const response = await axiosInstance.delete(`/cart/${productId}`);
            const updatedCart = response.data?.data;
            if (updatedCart) {
                setCart(updatedCart);
                toast.success("Item removed from cart");
            }
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to remove item from cart";
            toast.error(message);
            throw error.response?.data || error;
        } finally {
            setLoading(false);
        }
    };

    // Update item quantity in cart (syncs with PUT /cart/:id)
    const updateQuantity = async (productId, quantity) => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const response = await axiosInstance.put(`/cart/${productId}`, { quantity });
            const updatedCart = response.data?.data;
            if (updatedCart) {
                setCart(updatedCart);
            }
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to update item quantity";
            toast.error(message);
            throw error.response?.data || error;
        } finally {
            setLoading(false);
        }
    };

    // Clear cart (syncs with DELETE /cart/clear)
    const clearCart = async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const response = await axiosInstance.delete("/cart/clear");
            const updatedCart = response.data?.data;
            setCart(updatedCart || { items: [], shop: null, totalPrice: 0 });
            toast.success("Cart cleared");
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to clear cart";
            toast.error(message);
            throw error.response?.data || error;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        cart,
        cartItems: cart?.items || [],
        cartCount,
        loading,
        fetchCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};

export default CartContext;
