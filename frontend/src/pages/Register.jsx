import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./Register.css";

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
        <div className="register-container">
            <h2 className="register-title">Create Nearbuy Account</h2>
            <form onSubmit={handleSubmit}>
                <div className="register-form-group">
                    <label className="register-label">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="register-input"
                    />
                </div>
                <div className="register-form-group">
                    <label className="register-label">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="register-input"
                    />
                </div>
                <div className="register-form-group">
                    <label className="register-label">Phone Number</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="register-input"
                    />
                </div>
                <div className="register-form-group">
                    <label className="register-label">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="register-input"
                    />
                </div>
                <div className="register-form-group">
                    <label className="register-label">Account Type / Role</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="register-select"
                    >
                        <option value="customer">Customer</option>
                        <option value="vendor">Shop Owner / Vendor</option>
                        <option value="delivery">Delivery Partner</option>
                    </select>
                </div>
                <div className="register-form-group">
                    <label className="register-label">Profile Image (Avatar)</label>
                    <input
                        type="file"
                        name="avatar"
                        onChange={handleFileChange}
                        required
                        accept="image/*"
                        className="register-file-input"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="register-submit-btn"
                >
                    {loading ? "Registering..." : "Create Account"}
                </button>
            </form>
            <p className="register-footer-text">
                Already have an account? <Link to="/login" className="register-link">Sign In</Link>
            </p>
        </div>
    );
};

export default Register;
