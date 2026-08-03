import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

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
        <div style={{ maxWidth: "400px", margin: "4rem auto", padding: "2rem", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", background: "#fff" }}>
            <h2 style={{ marginBottom: "1.5rem", textAlign: "center", color: "#1f2937" }}>Sign In to Nearbuy</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}>Email or Username</label>
                    <input
                        type="text"
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                        required
                        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    />
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "600" }}>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{ width: "100%", padding: "0.75rem", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </form>
            <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>
                Don't have an account? <Link to="/register" style={{ color: "#2563eb", fontWeight: "600" }}>Register</Link>
            </p>
        </div>
    );
};

export default Login;
