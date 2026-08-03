import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";

// Public / Auth Pages
import Login from "../pages/Login";
import Register from "../pages/Register";

// Customer Pages
import CustomerHome from "../pages/customer/Home";
import ShopDetails from "../pages/customer/ShopDetails";
import Cart from "../pages/customer/Cart";
import Checkout from "../pages/customer/Checkout";
import CustomerOrders from "../pages/customer/Orders";
import Profile from "../pages/customer/Profile";

// Shop Owner Pages
import ShopDashboard from "../pages/shopOwner/Dashboard";
import ManageProducts from "../pages/shopOwner/ManageProducts";
import ShopOrders from "../pages/shopOwner/Orders";
import SalesReport from "../pages/shopOwner/SalesReport";

// Delivery Pages
import DeliveryDashboard from "../pages/delivery/DeliveryDashboard";
import ActiveOrder from "../pages/delivery/ActiveOrder";
import Earnings from "../pages/delivery/Earnings";

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<CustomerHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/shops" element={<CustomerHome />} />
            <Route path="/shops/:id" element={<ShopDetails />} />

            {/* 1. Protected Customer Route Group (/customer/*) */}
            <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
                <Route path="/customer" element={<CustomerHome />} />
                <Route path="/customer/profile" element={<Profile />} />
                <Route path="/customer/cart" element={<Cart />} />
                <Route path="/customer/checkout" element={<Checkout />} />
                <Route path="/customer/orders" element={<CustomerOrders />} />
                {/* Customer Root Shortcuts */}
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<CustomerOrders />} />
                <Route path="/profile" element={<Profile />} />
            </Route>

            {/* 2. Protected Shop Owner Route Group (/shop/* & /vendor/*) */}
            <Route element={<ProtectedRoute allowedRoles={["vendor", "shopOwner"]} />}>
                <Route path="/shop" element={<ShopDashboard />} />
                <Route path="/shop/dashboard" element={<ShopDashboard />} />
                <Route path="/shop/products" element={<ManageProducts />} />
                <Route path="/shop/orders" element={<ShopOrders />} />
                <Route path="/shop/sales" element={<SalesReport />} />

                {/* Vendor Aliases */}
                <Route path="/vendor" element={<Navigate to="/shop/dashboard" replace />} />
                <Route path="/vendor/dashboard" element={<ShopDashboard />} />
                <Route path="/vendor/shop" element={<ShopDashboard />} />
                <Route path="/vendor/products" element={<ManageProducts />} />
                <Route path="/vendor/orders" element={<ShopOrders />} />
            </Route>

            {/* 3. Protected Delivery Partner Route Group (/delivery/*) */}
            <Route element={<ProtectedRoute allowedRoles={["delivery"]} />}>
                <Route path="/delivery" element={<DeliveryDashboard />} />
                <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
                <Route path="/delivery/active" element={<ActiveOrder />} />
                <Route path="/delivery/active-order" element={<ActiveOrder />} />
                <Route path="/delivery/earnings" element={<Earnings />} />
                <Route path="/delivery/history" element={<Earnings />} />
            </Route>

            {/* Catch-all 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
