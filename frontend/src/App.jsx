import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <div className="app-layout" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                    <Toaster position="top-right" />
                    <Navbar />
                    <main style={{ flex: 1 }}>
                        <AppRoutes />
                    </main>
                    <Footer />
                </div>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
