import React from "react";
import "./Loader.css";

const Loader = ({ fullScreen = false, message = "Loading...", size = "medium" }) => {
    return (
        <div className={`loader-container ${fullScreen ? "fullscreen" : ""}`}>
            <div className={`spinner ${size}`} />
            {message && <p className="loader-message">{message}</p>}
        </div>
    );
};

export default Loader;
