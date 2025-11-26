import React from "react";
import "./Header.css";

const Header = ({ onLoginClick, onLogoClick, isLoggedIn }) => {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo" onClick={onLogoClick}>
          Reddit Clone
        </h1>
      </div>

      <div className="header-center">
        <input
          type="text"
          placeholder="Search posts or communities..."
          className="search-input"
        />
      </div>

      <div className="header-right">
        {isLoggedIn ? (
          <button className="user-btn">User</button>
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
