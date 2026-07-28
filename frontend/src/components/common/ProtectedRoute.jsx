import React from "react";
import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loader from "./Loader";
import "./ProtectedRoute.css";

const ProtectedRoute = ({ allowedRoles = [], children }) => {
    const { user, token, role, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Show loading spinner while AuthContext resolves stored token/user
    if (loading) {
        return <Loader fullScreen message="Verifying session..." />;
    }

    // Redirect to login if token or authentication is missing
    if (!isAuthenticated || !token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role check if allowedRoles are specified
    const userRole = role || user.role;
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return (
            <div className="unauthorized-container">
                <div className="unauthorized-card">
                    <h2>Access Denied</h2>
                    <p>You do not have permission to view this page ({userRole ? `Role: ${userRole}` : "No Role"}).</p>
                    <Link to="/">Return to Home</Link>
                </div>
            </div>
        );
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
