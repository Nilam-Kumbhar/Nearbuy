import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import ProductCard from "../../components/product/ProductCard";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import "./ShopDetails.css";

const ShopDetails = () => {
    const { id } = useParams();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShopAndProducts = async () => {
            setLoading(true);
            try {
                // Fetch nearby shops to get this shop or shop products directly
                const productsRes = await axiosInstance.get("/products", { params: { shop: id } });
                setProducts(productsRes.data?.data || []);

                // Fetch shop details if available via products or shop query
                if (productsRes.data?.data?.[0]?.shop) {
                    setShop(productsRes.data.data[0].shop);
                } else {
                    // Fallback nearby shops request to extract shop metadata
                    const nearbyRes = await axiosInstance.get("/shops/nearby", {
                        params: { latitude: 19.0760, longitude: 72.8777, radius: 50 }
                    });
                    const found = (nearbyRes.data?.data || []).find((s) => s._id === id);
                    if (found) setShop(found);
                }
            } catch (error) {
                console.error("Failed to load shop details:", error);
                toast.error("Failed to load shop products");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchShopAndProducts();
    }, [id]);

    if (loading) {
        return <Loader message="Loading shop products..." />;
    }

    const shopImage = shop?.images && shop.images.length > 0
        ? (typeof shop.images[0] === "string" ? shop.images[0] : shop.images[0]?.url)
        : "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=400";

    return (
        <div className="shop-details-container">
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600", display: "inline-block", marginBottom: "1rem" }}>
                ← Back to Shops
            </Link>

            {/* Shop Header */}
            <div className="shop-header-banner">
                <img src={shopImage} alt={shop?.name || "Shop"} className="shop-banner-image" />
                <div className="shop-header-info">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <h1 className="shop-header-title">{shop?.name || "Neighborhood Store"}</h1>
                        <span className="shop-header-badge">{shop?.isOpen !== false ? "Open" : "Closed"}</span>
                    </div>
                    <p style={{ color: "#6b7280", margin: "0 0 0.5rem 0" }}>{shop?.description || "Quality products delivered fast from nearby."}</p>
                    <div className="shop-header-meta">
                        <span>🏷️ Category: <strong>{shop?.category || "General"}</strong></span>
                        <span>📍 {shop?.address?.addressLine || shop?.address?.city || "Local City"}</span>
                        <span>⭐ Rating: 4.5/5</span>
                        <span>⚡ Delivery Radius: {shop?.deliveryRadiusKm || 5} km</span>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="shop-products-section">
                <div className="shop-products-header">
                    <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", margin: 0 }}>
                        Available Products ({products.length})
                    </h2>
                </div>

                {products.length === 0 ? (
                    <div className="empty-products">
                        <h3>No products found in this shop.</h3>
                        <p>Check back later or explore other nearby shops.</p>
                    </div>
                ) : (
                    <div className="shop-products-grid">
                        {products.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopDetails;
