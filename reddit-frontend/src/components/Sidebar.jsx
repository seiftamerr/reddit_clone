import React from "react";
import "./Sidebar.css";

const Sidebar = ({ communities, onHomeClick, onCreateCommunity, onSelectCommunity }) => {
  return (
    <aside className="sidebar">
      {/* Home section */}
      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Home</h2>
        <button className="sidebar-btn" onClick={onHomeClick}>
          Popular
        </button>
        <button className="sidebar-btn" onClick={onHomeClick}>
          All
        </button>
      </div>

      {/* Create section */}
      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Create</h2>
        <button className="sidebar-btn" onClick={onCreateCommunity}>
          Create Community
        </button>
      </div>

      {/* Trending Communities */}
      <div className="sidebar-section">
        <h2 className="sidebar-section-title">Trending Communities</h2>
        {communities.map((c) => (
          <button key={c.id} className="sidebar-btn" onClick={() => onSelectCommunity(c)}>
            r/{c.name}
          </button>
        ))}
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
