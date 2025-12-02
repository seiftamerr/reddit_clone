import React, { useState, useEffect } from "react";
import "./CommunityPage.css";
import { API_URL } from "../config";

const CommunityPage = ({ community, onJoinLeave, onCreatePost, onViewPost, onVote, user, onViewUserProfile }) => {
  const [postSort, setPostSort] = useState("new");
  const [sortedPosts, setSortedPosts] = useState(community?.posts || []);

  useEffect(() => {
    if (community?._id) {
      fetch(`${API_URL}/posts?communityId=${community._id}&sort=${postSort}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSortedPosts(data);
          }
        })
        .catch(err => console.error("Error fetching sorted posts:", err));
    }
  }, [community?._id, postSort]);

  useEffect(() => {
    if (community?.posts) {
      setSortedPosts(community.posts);
    }
  }, [community]);

  if (!community) return null;

  const handleVoteClick = (e, post, voteType) => {
    e.stopPropagation(); // Prevent opening the post when clicking vote buttons
    if (!user) {
      alert("Please log in to vote");
      return;
    }
    if (onVote) {
      const userVote = user ? 
        (post.upvotes?.some(id => id.toString() === user._id || id._id === user._id) ? 1 :
         post.downvotes?.some(id => id.toString() === user._id || id._id === user._id) ? -1 : 0)
        : 0;
      const newVote = userVote === voteType ? 0 : voteType;
      onVote(post._id, newVote);
    }
  };

  const handleJoinLeave = () => {
    if (!user) {
      alert("You need to be signed in to join or leave a community");
      return;
    }
    onJoinLeave(community._id);
  };

  const handleCreatePost = () => {
    if (!user) {
      alert("You need to be signed in to create a post");
      return;
    }
    onCreatePost();
  };

  return (
    <div className="page">
      <h2>r/{community.name}</h2>

      <button onClick={handleJoinLeave}>
        {user && community.members && community.members.some((m) => {
          const memberId = (m._id || m || (typeof m === 'string' ? m : null));
          const userId = (user._id || user.id);
          if (!memberId || !userId) return false;
          return memberId.toString() === userId.toString();
        })
          ? "Leave"
          : "Join"}
      </button>

      <p>{community.members.length} members</p>

      <button onClick={handleCreatePost}>Create Post</button>

      <div className="posts-header">
        <h3>Posts</h3>
        <select
          value={postSort}
          onChange={(e) => setPostSort(e.target.value)}
          className="post-sort-select"
        >
          <option value="new">New</option>
          <option value="top">Top (Most Votes)</option>
        </select>
      </div>
      {(!sortedPosts || sortedPosts.length === 0) && <p>No posts yet.</p>}

      {sortedPosts &&
        sortedPosts.map((p) => {
          const voteCount = (p.upvotes?.length || 0) - (p.downvotes?.length || 0);
          const userVote = user ? 
            (p.upvotes?.some(id => id.toString() === user._id || id._id === user._id) ? 1 :
             p.downvotes?.some(id => id.toString() === user._id || id._id === user._id) ? -1 : 0)
            : 0;
          
          return (
            <div key={p._id} className="post">
              <div className="post-content" onClick={() => onViewPost(p)}>
                <div className="post-voting" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="vote-btn-small"
                    onClick={(e) => handleVoteClick(e, p, 1)}
                    style={{
                      backgroundColor: userVote === 1 ? "#ff4500" : "#f0f0f0",
                      color: userVote === 1 ? "white" : "black",
                    }}
                  >
                    ▲
                  </button>
                  <span className="vote-count-small">{voteCount}</span>
                  <button
                    className="vote-btn-small"
                    onClick={(e) => handleVoteClick(e, p, -1)}
                    style={{
                      backgroundColor: userVote === -1 ? "#7193ff" : "#f0f0f0",
                      color: userVote === -1 ? "white" : "black",
                    }}
                  >
                    ▼
                  </button>
                </div>
                <div className="post-main">
                  <h4>{p.title}</h4>
                  <p>{p.content.slice(0, 120)}{p.content.length > 120 ? "..." : ""}</p>

                  <div className="post-meta">
                    <span>
                      By{" "}
                      {p.creatorId?._id ? (
                        <button
                          className="username-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewUserProfile && p.creatorId._id) {
                              onViewUserProfile(p.creatorId._id);
                            }
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#0079d3",
                            cursor: "pointer",
                            textDecoration: "underline",
                            padding: 0,
                            font: "inherit",
                          }}
                        >
                          {p.creatorId.username || "Unknown"}
                        </button>
                      ) : (
                        <span>{p.creatorId?.username || "Unknown"}</span>
                      )}
                    </span>
                    <span>{p.comments ? p.comments.length : 0} comments</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default CommunityPage;
