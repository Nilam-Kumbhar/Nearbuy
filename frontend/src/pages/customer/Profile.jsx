import React from "react";
import { useAuth } from "../../context/AuthContext";

const Profile = () => {
    const { user } = useAuth();
    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <h2>My Profile</h2>
            {user && (
                <div>
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                </div>
            )}
        </div>
    );
};

export default Profile;
