import React from "react";
import "./Header.css";
import { useTheme } from "../ThemeContext";

const Header = ({ 
  onLoginClick, 
  onLogoClick, 
  isLoggedIn, 
  onProfileClick, 
  onSearch 
}) => {
  const { isDarkMode, toggleTheme } = useTheme();

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
          placeholder="Search posts, communities, or users..."
          className="search-input"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}>
          {isDarkMode ? "☀️" : "🌙"}
        </button>
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
