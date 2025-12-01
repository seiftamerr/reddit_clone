import React from "react";
import "./CommunityPage.css";

const CommunityPage = ({ community, onJoinLeave, onCreatePost, onViewPost }) => {
  if (!community) return null;

  return (
    <div className="page">
      <h2>r/{community.name}</h2>

      <button onClick={onJoinLeave}>
        {community.members.some((m) => m._id === community.creatorId._id || m._id === community.creatorId)
          ? "Leave"
          : "Join"}
      </button>

      <p>{community.members.length} members</p>

      <button onClick={onCreatePost}>Create Post</button>

      <h3>Posts</h3>
      {(!community.posts || community.posts.length === 0) && <p>No posts yet.</p>}

      {community.posts &&
        community.posts.map((p) => (
          <div key={p._id} className="post" onClick={() => onViewPost(p)}>
            <div className="post-content">
              <h4>{p.title}</h4>
              <p>{p.content.slice(0, 120)}{p.content.length > 120 ? "..." : ""}</p>

              <div className="post-meta">
                <span>By {p.creatorId?.username || "Unknown"}</span>
                <span>{p.comments ? p.comments.length : 0} comments</span>
                <span>{(p.upvotes?.length || 0) - (p.downvotes?.length || 0)} votes</span>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default CommunityPage;
