import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import "./Navbar.css";

const Navbar = () => {
    const { user, role, isAuthenticated, logout } = useAuth();
    const { cartCount } = useCart();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const userRole = role || user?.role || "customer";

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <span className="navbar-logo-text">Nearbuy</span>
                    <span className="navbar-tagline">| Hyperlocal</span>
                </Link>

                <button
                    className="navbar-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle Navigation"
                >
                    ☰
                </button>

                <div className={`navbar-menu ${mobileMenuOpen ? "open" : ""}`}>
                    <ul className="navbar-links">
                        {/* Public / Customer Links */}
                        {(userRole === "customer" || !isAuthenticated) && (
                            <>
                                <li>
                                    <NavLink to="/" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
                                        Home
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/shops" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
                                        Shops
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/products" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
                                        Products
                                    </NavLink>
                                </li>
                                {isAuthenticated && (
                                    <>
                                        <li>
                                            <NavLink to="/orders" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
                                                My Orders
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/cart" className={({ isActive }) => `navbar-link navbar-cart-link ${isActive ? "active" : ""}`}>
                                                🛒 Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                            </NavLink>
                                        </li>
                                    </>
                                )}
                            </>
                        )}

                        {/* Vendor / Shop Owner Links */}
                        {userRole === "vendor" && (
                            <>
                                <li>
                                    <NavLink to="/vendor/dashboard" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
                                        Dashboard
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/vendor/shop" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
                                        My Shop
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/vendor/products" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
                                        Products
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/vendor/orders" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
                                        Orders
                                    </NavLink>
                                </li>
                            </>
                        )}

                        {/* Delivery Partner Links */}
                        {userRole === "delivery" && (
                            <>
                                <li>
                                    <NavLink to="/delivery/dashboard" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
                                        Dashboard
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/delivery/active" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
                                        Active Deliveries
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/delivery/history" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}>
                                        History
                                    </NavLink>
                                </li>
                            </>
                        )}
                    </ul>

                    <div className="navbar-user-section">
                        {isAuthenticated && user ? (
                            <>
                                <div className="user-profile-badge">
                                    {user.avatar && (
                                        <img src={user.avatar} alt={user.username} className="user-avatar" />
                                    )}
                                    <span className="user-name">{user.username}</span>
                                    <span className={`role-tag ${userRole}`}>{userRole}</span>
                                </div>
                                <button onClick={handleLogout} className="btn-logout">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="navbar-auth-buttons">
                                <Link to="/login" className="btn-login">
                                    Login
                                </Link>
                                <Link to="/register" className="btn-register">
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
