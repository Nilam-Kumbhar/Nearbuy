import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import ShopList from "../../components/shop/ShopList";
import toast from "react-hot-toast";
import "./Home.css";

const CATEGORIES = [
    "All",
    "Grocery",
    "Bakery",
    "Fruits & Vegetables",
    "Dairy",
    "Pharmacy",
    "Electronics",
    "General"
];

const Home = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [radius, setRadius] = useState(5); // in km
    const [location, setLocation] = useState({
        lat: 19.0760, // Default Mumbai coordinates
        lng: 72.8777,
        name: "Mumbai (Default)"
    });

    const fetchNearbyShops = async () => {
        setLoading(true);
        try {
            const params = {
                latitude: location.lat,
                longitude: location.lng,
                radius
            };
            if (selectedCategory !== "All") {
                params.category = selectedCategory;
            }

            const res = await axiosInstance.get("/shops/nearby", { params });
            setShops(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch nearby shops:", error);
            toast.error("Failed to load nearby shops");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNearbyShops();
    }, [location, selectedCategory, radius]);

    const handleLocateMe = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        name: "Current Location"
                    });
                    toast.success("Location updated to current position!");
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    toast.error("Unable to get current location. Using default location.");
                }
            );
        } else {
            toast.error("Geolocation is not supported by your browser");
        }
    };

    const filteredShops = shops.filter((shop) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            shop.name?.toLowerCase().includes(query) ||
            shop.category?.toLowerCase().includes(query) ||
            shop.address?.city?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="home-container">
            {/* Hero Section */}
            <div className="home-hero">
                <h1 className="home-hero-title">Hyperlocal Shopping, Delivered in Minutes</h1>
                <p className="home-hero-subtitle">
                    Discover fresh groceries, daily essentials, and local neighborhood stores delivered right to your doorstep.
                </p>

                <div className="home-search-bar">
                    <input
                        type="text"
                        placeholder="Search for local shops, groceries, or essentials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="home-search-input"
                    />
                    <button onClick={handleLocateMe} className="home-locate-btn">
                        📍 Locate Me
                    </button>
                </div>
            </div>

            {/* Controls / Filters */}
            <div className="home-controls">
                <div className="home-categories">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="home-radius-selector">
                    <label>Distance Radius:</label>
                    <select
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="home-radius-select"
                    >
                        <option value={2}>Within 2 km</option>
                        <option value={5}>Within 5 km</option>
                        <option value={10}>Within 10 km</option>
                        <option value={20}>Within 20 km</option>
                    </select>
                </div>
            </div>

            {/* Nearby Shops Section */}
            <h2 className="home-section-title">
                {selectedCategory !== "All" ? `${selectedCategory} Shops Nearby` : "Nearby Neighborhood Shops"}
            </h2>

            <ShopList
                shops={filteredShops}
                loading={loading}
                emptyMessage={`No ${selectedCategory !== "All" ? selectedCategory.toLowerCase() : ""} shops found within ${radius}km.`}
            />
        </div>
    );
};

export default Home;
