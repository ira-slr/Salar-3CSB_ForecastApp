import React from 'react';

const Header = () => {
  const handleNavClick = (section) => {
    alert(`${section} feature coming soon!`);
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-area">
          <h1 className="header-title">Tech Store Inventory</h1>
        </div>
        <nav>
          <span className="nav-link" onClick={() => handleNavClick('Dashboard')}>Dashboard</span>
          <span className="nav-link" onClick={() => handleNavClick('Reports')}>Reports</span>
          <span className="nav-link" onClick={() => handleNavClick('Admin')}>Admin</span>
        </nav>
      </div>
    </header>
  );
};

export default Header;