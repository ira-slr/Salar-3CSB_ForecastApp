import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <p className="footer-text">
        © {new Date().getFullYear()} Nexus Gaming Systems. Powered by TensorFlow.js
      </p>
      <div className="footer-links">
        <span>Privacy Policy</span> | <span>Terms of Service</span>
      </div>
    </footer>
  );
};

export default Footer;