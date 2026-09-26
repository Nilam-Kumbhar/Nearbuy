import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.css";

const NotFound = () => {
    return (
        <div className="not-found-container">
            <h1 className="not-found-code">404</h1>
            <h2 className="not-found-title">Page Not Found</h2>
            <p className="not-found-desc">
                Sorry, the page you are looking for does not exist or has been moved.
            </p>
            <Link to="/" className="not-found-btn">
                Back to Home
            </Link>
        </div>
    );
};

export default NotFound;
