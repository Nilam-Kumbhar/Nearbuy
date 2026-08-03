import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "./Profile.css";

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        toast.success("Logged out successfully");
        navigate("/login");
    };

    if (!user) return null;

    const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=2563eb&color=fff`;

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <img src={avatarUrl} alt={user.username} className="profile-avatar-large" />
                    <div className="profile-info">
                        <h1>{user.username}</h1>
                        <p>{user.email}</p>
                        <span className={`role-tag ${user.role}`}>{user.role}</span>
                    </div>
                </div>

                <div className="profile-details-grid">
                    <div className="profile-detail-box">
                        <label>Username</label>
                        <span>{user.username}</span>
                    </div>

                    <div className="profile-detail-box">
                        <label>Email Address</label>
                        <span>{user.email}</span>
                    </div>

                    <div className="profile-detail-box">
                        <label>Phone Number</label>
                        <span>{user.phone || "Not provided"}</span>
                    </div>

                    <div className="profile-detail-box">
                        <label>Account Role</label>
                        <span>{user.role ? user.role.toUpperCase() : "CUSTOMER"}</span>
                    </div>
                </div>

                <div className="profile-actions">
                    <button onClick={handleLogout} className="btn-profile-logout">
                        Sign Out of Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
