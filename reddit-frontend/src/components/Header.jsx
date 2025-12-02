import React from "react";
import "./Header.css";

const Header = ({ 
  onLoginClick, 
  onLogoClick, 
  isLoggedIn, 
  onProfileClick, 
  onSearch 
}) => {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo" onClick={onLogoClick}>
          Reddex
        </h1>
      </div>

      <div className="header-center">
        <input
          type="text"
          placeholder="Search posts or communities..."
          className="search-input"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="header-right">
        {isLoggedIn ? (
          <button className="user-btn" onClick={onProfileClick}>
            Profile
          </button>
        ) : (
          <button className="login-btn" onClick={onLoginClick}>
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
