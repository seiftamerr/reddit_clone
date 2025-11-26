import React from "react";
import "./CommunityPage.css";

const CommunityPage = ({ community, onJoinLeave, onCreatePost }) => {
  if (!community) return null;

  return (
    <div className="page">
      <h2>r/{community.name}</h2>

      <button onClick={() => onJoinLeave(community.id)}>
        {community.joined ? "Leave" : "Join"}
      </button>

      <p>{community.members} members</p>

      <button onClick={onCreatePost}>Create Post</button>

      <h3>Posts</h3>
      {community.posts.length === 0 && <p>No posts yet.</p>}

      {community.posts.map((p) => (
        <div key={p.id} className="post">
          <h4>{p.title}</h4>
          <p>{p.content}</p>
          <span>By {p.author}</span>
        </div>
      ))}
    </div>
  );
};

export default CommunityPage;
