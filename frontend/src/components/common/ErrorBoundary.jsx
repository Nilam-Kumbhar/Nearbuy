import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ maxWidth: "600px", margin: "5rem auto", padding: "2.5rem", textAlign: "center", background: "#ffffff", borderRadius: "16px", border: "1px solid #e5e7eb", boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}>
                    <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>⚠️</div>
                    <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#111827", marginBottom: "0.5rem" }}>
                        Something Went Wrong
                    </h2>
                    <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
                        An unexpected application error occurred. Please refresh or return home.
                    </p>
                    <button
                        onClick={this.handleReload}
                        style={{ backgroundColor: "#2563eb", color: "#ffffff", padding: "0.75rem 1.5rem", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "1rem", cursor: "pointer" }}
                    >
                        Return to Safety
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
