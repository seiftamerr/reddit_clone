import React from "react";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* Reddit Logo or Section */}
      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Home</h2>
        <button className="sidebar-btn">Popular</button>
        <button className="sidebar-btn">All</button>
      </div>

      {/* Create Post Section */}
      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Create</h2>
        <button className="sidebar-btn">Create Post</button>
        <button className="sidebar-btn">Create Community</button>
      </div>

      {/* Trending Communities */}
      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Trending Communities</h2>
        <button className="sidebar-btn">r/ReactJS</button>
        <button className="sidebar-btn">r/JavaScript</button>
        <button className="sidebar-btn">r/WebDev</button>
        <button className="sidebar-btn">r/NodeJS</button>
        <button className="sidebar-btn">r/Frontend</button>
      </div>

      {/* User Section */}
      <div className="sidebar-section">
        <h2 className="sidebar-section-title">User</h2>
        <button className="sidebar-btn">Profile</button>
        <button className="sidebar-btn">Settings</button>
        <button className="sidebar-btn">Log Out</button>
      </div>
    </aside>
  );
};

export default Sidebar;
