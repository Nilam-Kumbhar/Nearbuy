import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./Login.css";

const Login = () => {
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await login(credentials);
            toast.success("Logged in successfully!");
            const userRole = res?.data?.user?.role;
            if (userRole === "vendor" || userRole === "shopOwner") {
                navigate("/shop/dashboard");
            } else if (userRole === "delivery") {
                navigate("/delivery/dashboard");
            } else {
                navigate("/");
            }
        } catch (error) {
            toast.error(error?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2 className="login-title">Sign In to Nearbuy</h2>
            <form onSubmit={handleSubmit}>
                <div className="login-form-group">
                    <label className="login-label">Email or Username</label>
                    <input
                        type="text"
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                        required
                        className="login-input"
                    />
                </div>
                <div className="login-form-group">
                    <label className="login-label">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                        className="login-input"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="login-submit-btn"
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </form>
            <p className="login-footer-text">
                Don't have an account? <Link to="/register" className="login-link">Register</Link>
            </p>
        </div>
    );
};

export default Login;
