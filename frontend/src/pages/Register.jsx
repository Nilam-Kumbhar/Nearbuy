import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Register = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "customer",
        phone: ""
    });
    const [avatar, setAvatar] = useState(null);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setAvatar(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach((key) => {
            data.append(key, formData[key]);
        });
        if (avatar) {
            data.append("avatar", avatar);
        }

        try {
            await register(data);
            toast.success("Registration successful! Please sign in.");
            navigate("/login");
        } catch (error) {
            toast.error(error?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "450px", margin: "3rem auto", padding: "2rem", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", background: "#fff" }}>
            <h2 style={{ marginBottom: "1.5rem", textAlign: "center", color: "#1f2937" }}>Create Nearbuy Account</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: "600" }}>Username</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} required style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }} />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: "600" }}>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }} />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: "600" }}>Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} required style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }} />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: "600" }}>Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }} />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: "600" }}>Account Type / Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                        <option value="customer">Customer</option>
                        <option value="vendor">Shop Owner / Vendor</option>
                        <option value="delivery">Delivery Partner</option>
                    </select>
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: "600" }}>Profile Image (Avatar)</label>
                    <input type="file" name="avatar" onChange={handleFileChange} required accept="image/*" style={{ width: "100%" }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.75rem", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                    {loading ? "Registering..." : "Create Account"}
                </button>
            </form>
            <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>
                Already have an account? <Link to="/login" style={{ color: "#2563eb", fontWeight: "600" }}>Sign In</Link>
            </p>
        </div>
    );
};

export default Register;
