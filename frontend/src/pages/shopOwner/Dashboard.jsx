import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import "./Dashboard.css";

const Dashboard = () => {
    const [shop, setShop] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    // Form state if shop needs creation
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [shopFormData, setShopFormData] = useState({
        name: "",
        category: "Grocery",
        description: "",
        addressLine: "",
        city: "",
        pincode: "",
        latitude: "19.0760",
        longitude: "72.8777",
        opensAt: "09:00",
        closesAt: "21:00",
        deliveryRadiusKm: "5"
    });

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch Shop
            const shopRes = await axiosInstance.get("/shops/my-shop");
            const currentShop = shopRes.data?.data;
            setShop(currentShop);

            if (currentShop?._id) {
                // Fetch Orders & Products
                const [ordersRes, productsRes] = await Promise.all([
                    axiosInstance.get("/orders/shop-orders").catch(() => ({ data: { data: [] } })),
                    axiosInstance.get("/products", { params: { shop: currentShop._id } }).catch(() => ({ data: { data: [] } }))
                ]);
                setOrders(ordersRes.data?.data || []);
                setProducts(productsRes.data?.data || []);
            }
        } catch (error) {
            console.error("Dashboard error:", error);
            if (error.response?.status === 404) {
                setShowCreateForm(true);
            } else {
                toast.error("Failed to load shop dashboard data");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleToggleShopStatus = async () => {
        if (!shop?._id) return;
        setToggling(true);
        const newStatus = !shop.isOpen;
        try {
            const res = await axiosInstance.put(`/shops/update/${shop._id}`, { isOpen: newStatus });
            setShop(res.data?.data);
            toast.success(`Shop is now ${newStatus ? "OPEN for orders" : "CLOSED"}`);
        } catch (error) {
            toast.error("Failed to update shop status");
        } finally {
            setToggling(false);
        }
    };

    const handleCreateShopSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axiosInstance.post("/shops/create", shopFormData);
            setShop(res.data?.data);
            setShowCreateForm(false);
            toast.success("Shop registered successfully!");
            fetchDashboardData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create shop");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader message="Loading shop owner dashboard..." />;
    }

    if (showCreateForm && !shop) {
        return (
            <div className="shop-dashboard-container">
                <div className="shop-info-card" style={{ maxWidth: "600px", margin: "2rem auto" }}>
                    <h2 style={{ marginBottom: "1rem" }}>Register Your Neighborhood Shop</h2>
                    <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Fill in your store details to start accepting local orders on Nearbuy.</p>
                    <form onSubmit={handleCreateShopSubmit}>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>Shop Name</label>
                            <input type="text" required value={shopFormData.name} onChange={(e) => setShopFormData({ ...shopFormData, name: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }} />
                        </div>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>Category</label>
                            <select value={shopFormData.category} onChange={(e) => setShopFormData({ ...shopFormData, category: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}>
                                <option value="Grocery">Grocery</option>
                                <option value="Bakery">Bakery</option>
                                <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                                <option value="Dairy">Dairy</option>
                                <option value="Pharmacy">Pharmacy</option>
                                <option value="Electronics">Electronics</option>
                                <option value="General">General</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>Address Line</label>
                            <input type="text" required value={shopFormData.addressLine} onChange={(e) => setShopFormData({ ...shopFormData, addressLine: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>City</label>
                                <input type="text" required value={shopFormData.city} onChange={(e) => setShopFormData({ ...shopFormData, city: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>Pincode</label>
                                <input type="text" required value={shopFormData.pincode} onChange={(e) => setShopFormData({ ...shopFormData, pincode: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }} />
                            </div>
                        </div>
                        <button type="submit" style={{ width: "100%", padding: "0.75rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                            Register Shop
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const pendingOrders = orders.filter((o) => o.status === "pending");
    const totalSales = orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);

    return (
        <div className="shop-dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">{shop?.name || "Shop Owner Dashboard"}</h1>
                    <span style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                        Category: {shop?.category} | 📍 {shop?.address?.city || "Local City"}
                    </span>
                </div>

                <div className="shop-status-toggle">
                    <span style={{ fontWeight: "700", color: shop?.isOpen ? "#15803d" : "#b91c1c", fontSize: "0.9rem" }}>
                        STORE STATUS: {shop?.isOpen ? "ONLINE (OPEN)" : "OFFLINE (CLOSED)"}
                    </span>
                    <div
                        className={`toggle-switch ${shop?.isOpen ? "active" : ""}`}
                        onClick={!toggling ? handleToggleShopStatus : undefined}
                    >
                        <div className="toggle-circle" />
                    </div>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="dashboard-stats-grid">
                <div className="stat-card">
                    <div className="stat-title">Pending Orders</div>
                    <div className="stat-value" style={{ color: "#d97706" }}>{pendingOrders.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Total Orders</div>
                    <div className="stat-value">{orders.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Delivered Revenue</div>
                    <div className="stat-value" style={{ color: "#16a34a" }}>₹{totalSales.toFixed(2)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-title">Products in Inventory</div>
                    <div className="stat-value">{products.length}</div>
                </div>
            </div>

            {/* Quick Management Links */}
            <h2 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "1rem" }}>Quick Management Actions</h2>
            <div className="quick-actions-grid">
                <Link to="/shop/products" className="action-card">
                    <h3>📦 Manage Products</h3>
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>Add, edit prices, or update stock inventory levels.</p>
                </Link>

                <Link to="/shop/orders" className="action-card" style={{ background: "#fef3c7", borderColor: "#fde68a", color: "#92400e" }}>
                    <h3>📋 Incoming Orders</h3>
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>Review pending customer orders and update status.</p>
                </Link>

                <Link to="/shop/sales" className="action-card" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" }}>
                    <h3>📊 Sales & Analytics</h3>
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>View revenue charts, category performance, and trends.</p>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
