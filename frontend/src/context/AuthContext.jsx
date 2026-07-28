import React, { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem("token") || localStorage.getItem("accessToken") || null;
    });

    const [role, setRole] = useState(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try {
                return JSON.parse(savedUser)?.role || null;
            } catch {
                return null;
            }
        }
        return null;
    });

    const [loading, setLoading] = useState(true);

    // Sync user, token & role state with localStorage
    const updateAuthState = (userData, tokenVal) => {
        if (userData) {
            setUser(userData);
            setRole(userData.role || null);
            localStorage.setItem("user", JSON.stringify(userData));
        } else {
            setUser(null);
            setRole(null);
            localStorage.removeItem("user");
        }

        if (tokenVal) {
            setToken(tokenVal);
            localStorage.setItem("token", tokenVal);
            localStorage.setItem("accessToken", tokenVal);
        } else if (tokenVal === null) {
            setToken(null);
            localStorage.removeItem("token");
            localStorage.removeItem("accessToken");
        }
    };

    // Fetch current user on mount if token exists
    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
            if (storedToken) {
                try {
                    const response = await axiosInstance.get("/users/current-user");
                    const fetchedUser = response.data?.data;
                    if (fetchedUser) {
                        setUser(fetchedUser);
                        setRole(fetchedUser.role || null);
                        localStorage.setItem("user", JSON.stringify(fetchedUser));
                    }
                } catch (error) {
                    console.error("Failed to verify stored auth session:", error);
                    updateAuthState(null, null);
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    // Login user method
    const login = async (credentials) => {
        try {
            const response = await axiosInstance.post("/users/login", credentials);
            const { user: loggedInUser, accessToken } = response.data?.data || {};

            if (loggedInUser && accessToken) {
                updateAuthState(loggedInUser, accessToken);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    };

    // Register user method
    const register = async (data) => {
        try {
            let payload = data;

            if (!(data instanceof FormData) && typeof data === "object") {
                const formData = new FormData();
                Object.keys(data).forEach((key) => {
                    if (data[key] !== undefined && data[key] !== null) {
                        formData.append(key, data[key]);
                    }
                });
                payload = formData;
            }

            const response = await axiosInstance.post("/users/register", payload, {
                headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {}
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    };

    // Logout user method
    const logout = async () => {
        try {
            await axiosInstance.post("/users/logout");
        } catch (error) {
            console.error("Logout request error:", error);
        } finally {
            updateAuthState(null, null);
        }
    };

    const value = {
        user,
        role,
        token,
        loading,
        login,
        register,
        logout,
        setUser,
        setRole,
        isAuthenticated: !!user && !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthContext;
