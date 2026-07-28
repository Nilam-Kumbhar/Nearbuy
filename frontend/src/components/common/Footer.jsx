import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-section">
                    <h3>Nearbuy</h3>
                    <p>
                        Your trusted hyper-local e-commerce platform. Connecting neighborhood shops with local customers for instant delivery and fresh products.
                    </p>
                </div>

                <div className="footer-section">
                    <h4>Quick Links</h4>
                    <ul className="footer-links">
                        <li><Link to="/shops">Explore Shops</Link></li>
                        <li><Link to="/products">Browse Products</Link></li>
                        <li><Link to="/orders">Track Orders</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>For Partners</h4>
                    <ul className="footer-links">
                        <li><Link to="/register">Become a Vendor</Link></li>
                        <li><Link to="/register">Join as Delivery Partner</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Support</h4>
                    <ul className="footer-links">
                        <li><a href="#help">Help & FAQ</a></li>
                        <li><a href="#privacy">Privacy Policy</a></li>
                        <li><a href="#terms">Terms of Service</a></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Nearbuy Network. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
