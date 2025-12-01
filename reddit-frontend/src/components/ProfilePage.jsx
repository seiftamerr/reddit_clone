import React, { useState } from "react";
import "./ProfilePage.css";

const ProfilePage = ({ user, posts, onSaveBio }) => {
  if (!user) return <p>Loading profile...</p>; // prevent white screen
  const [bio, setBio] = useState(user.bio || "");
  const userPosts = posts.filter((p) => p.author === user.username);

  return (
    <div className="page profile-page">
      <h2>{user.username}'s Profile</h2>

      <div className="profile-section">
        <label>Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
        <button onClick={() => onSaveBio(bio)}>Save</button>
      </div>

      <div className="profile-section">
        <h3>Your Joined Communities</h3>
        {user.joinedCommunities?.length === 0 ? (
          <p>You haven't joined any communities yet.</p>
        ) : (
          <ul>
            {user.joinedCommunities.map((name, i) => (
              <li key={i}>r/{name}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="profile-section">
        <h3>Your Posts</h3>
        {userPosts.length === 0 ? (
          <p>You haven't made any posts yet.</p>
        ) : (
          userPosts.map((post) => (
            <div key={post.id} className="profile-post">
              <h4>{post.title}</h4>
              <p>{post.content.slice(0, 140)}...</p>
              <span>{post.votes} votes</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
