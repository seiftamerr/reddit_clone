import React, { useState, useEffect } from "react";
import "./ProfilePage.css";

const ProfilePage = ({ user, posts, onSaveBio }) => {
  if (!user) return <p>Loading profile...</p>;

  const [bio, setBio] = useState(user.bio || "");

  // Update textarea if parent user.bio changes
  useEffect(() => {
    setBio(user.bio || "");
  }, [user.bio]);

  const userPosts = posts?.filter((p) => p.author === user.username) || [];

  const handleSave = () => {
    if (bio.trim() === user.bio) return; // nothing changed
    onSaveBio(bio); // call parent
  };

  return (
    <div className="page profile-page">
      <h2>{user.username}'s Profile</h2>

      {/* BIO SECTION */}
      <div className="profile-section">
        <label>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Write something about yourself"
        />
        <button
          onClick={handleSave}
          disabled={bio.trim() === user.bio}
        >
          Save
        </button>
      </div>

      {/* COMMUNITIES */}
      <div className="profile-section">
        <h3>Your Joined Communities</h3>
        {user.joinedCommunities?.length ? (
          <ul>
            {user.joinedCommunities.map((name, i) => (
              <li key={i}>r/{name}</li>
            ))}
          </ul>
        ) : (
          <p>You haven't joined any communities yet.</p>
        )}
      </div>

      {/* POSTS */}
      <div className="profile-section">
        <h3>Your Posts</h3>
        {userPosts.length ? (
          userPosts.map((post) => (
            <div key={post.id} className="profile-post">
              <h4>{post.title}</h4>
              <p>{post.content.slice(0, 140)}...</p>
              <span>{post.votes} votes</span>
            </div>
          ))
        ) : (
          <p>You haven't made any posts yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
