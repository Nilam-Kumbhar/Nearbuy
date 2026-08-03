import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";
import "./ManageProducts.css";

const ManageProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [shop, setShop] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Product Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "Grocery",
        price: "",
        discountPercent: "0",
        unit: "1 unit",
        stock: "10",
        isAvailable: true
    });
    const [images, setImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const fetchShopAndProducts = async () => {
        setLoading(true);
        try {
            const shopRes = await axiosInstance.get("/shops/my-shop");
            const myShop = shopRes.data?.data;
            setShop(myShop);

            if (myShop?._id) {
                const prodRes = await axiosInstance.get("/products", { params: { shop: myShop._id } });
                setProducts(prodRes.data?.data || []);
            }
        } catch (error) {
            console.error("Fetch products error:", error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShopAndProducts();
    }, []);

    const handleOpenAddModal = () => {
        setEditingProduct(null);
        setFormData({
            name: "",
            description: "",
            category: shop?.category || "Grocery",
            price: "",
            discountPercent: "0",
            unit: "1 unit",
            stock: "10",
            isAvailable: true
        });
        setImages([]);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || "",
            description: product.description || "",
            category: product.category || "Grocery",
            price: product.price || "",
            discountPercent: product.discountPercent || "0",
            unit: product.unit || "1 unit",
            stock: product.stock || "10",
            isAvailable: product.isAvailable !== false
        });
        setImages([]);
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        setImages(Array.from(e.target.files));
    };

    const handleSubmitProduct = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const data = new FormData();
        data.append("name", formData.name);
        data.append("description", formData.description);
        data.append("category", formData.category);
        data.append("price", formData.price);
        data.append("discountPercent", formData.discountPercent);
        data.append("unit", formData.unit);
        data.append("stock", formData.stock);
        data.append("isAvailable", formData.isAvailable);

        if (images.length > 0) {
            images.forEach((img) => data.append("images", img));
        }

        try {
            if (editingProduct) {
                await axiosInstance.put(`/products/${editingProduct._id}`, data);
                toast.success("Product updated successfully!");
            } else {
                await axiosInstance.post("/products/add", data);
                toast.success("Product added successfully!");
            }
            setIsModalOpen(false);
            fetchShopAndProducts();
        } catch (error) {
            console.error("Submit product error:", error);
            toast.error(error.response?.data?.message || "Failed to save product");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await axiosInstance.delete(`/products/${productId}`);
            toast.success("Product deleted successfully");
            setProducts(products.filter((p) => p._id !== productId));
        } catch (error) {
            toast.error("Failed to delete product");
        }
    };

    if (loading) {
        return <Loader message="Loading shop inventory products..." />;
    }

    return (
        <div className="manage-products-container">
            <div className="manage-products-header">
                <div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: "800", margin: 0 }}>Manage Inventory Products</h1>
                    <p style={{ color: "#6b7280", margin: 0 }}>Add, edit, or adjust stock for products in <strong>{shop?.name || "My Shop"}</strong>.</p>
                </div>
                <button onClick={handleOpenAddModal} className="add-product-btn">
                    + Add New Product
                </button>
            </div>

            {/* Products Table */}
            {products.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem", background: "#fff", borderRadius: "12px", border: "1px dashed #ccc" }}>
                    <h3>No products found in inventory</h3>
                    <p style={{ color: "#6b7280" }}>Click "+ Add New Product" to list your first item.</p>
                </div>
            ) : (
                <div className="products-table-container">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Discount</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const imgUrl = product.images?.[0]?.url || product.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=100";
                                return (
                                    <tr key={product._id}>
                                        <td>
                                            <img src={imgUrl} alt={product.name} className="product-img-thumb" />
                                        </td>
                                        <td>
                                            <strong>{product.name}</strong>
                                            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{product.unit}</div>
                                        </td>
                                        <td>{product.category}</td>
                                        <td><strong>₹{product.price}</strong></td>
                                        <td>{product.discountPercent}%</td>
                                        <td>{product.stock} units</td>
                                        <td>
                                            <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700", background: product.isAvailable && product.stock > 0 ? "#dcfce7" : "#fee2e2", color: product.isAvailable && product.stock > 0 ? "#15803d" : "#b91c1c" }}>
                                                {product.isAvailable && product.stock > 0 ? "In Stock" : "Out of Stock"}
                                            </span>
                                        </td>
                                        <td>
                                            <button onClick={() => handleOpenEditModal(product)} className="btn-edit-prod">Edit</button>
                                            <button onClick={() => handleDeleteProduct(product._id)} className="btn-delete-prod">Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h2 style={{ margin: 0 }}>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
                        </div>
                        <form onSubmit={handleSubmitProduct}>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>Product Name</label>
                                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>Price (₹)</label>
                                    <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>Discount (%)</label>
                                    <input type="number" min="0" max="100" value={formData.discountPercent} onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>Unit / Size</label>
                                    <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g. 500g, 1 kg, 1 pack" style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>Stock Count</label>
                                    <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>Category</label>
                                <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }} />
                            </div>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "block", fontWeight: "600", marginBottom: "0.3rem" }}>Product Images</label>
                                <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ width: "100%" }} />
                            </div>
                            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "0.6rem 1.25rem", borderRadius: "6px", border: "1px solid #ccc", background: "#f3f4f6", cursor: "pointer" }}>Cancel</button>
                                <button type="submit" disabled={submitting} style={{ padding: "0.6rem 1.25rem", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", fontWeight: "600", cursor: "pointer" }}>
                                    {submitting ? "Saving..." : "Save Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageProducts;
