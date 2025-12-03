import React, { useState, useEffect } from "react";
import "./ProfilePage.css";
import { API_URL } from "../config";

const ProfilePage = ({ user, onSaveBio, currentUser }) => {
  if (!user) return <p>Loading profile...</p>;

  const [bio, setBio] = useState(user.bio || "");
  const [successMessage, setSuccessMessage] = useState("");
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [profileUser, setProfileUser] = useState(user);
  const [isFollowing, setIsFollowing] = useState(false);
  const [username, setUsername] = useState(user.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updatingAccount, setUpdatingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountSuccess, setAccountSuccess] = useState("");

  const isOwnProfile = currentUser && user && 
    (currentUser._id?.toString() === user._id?.toString() || 
     currentUser.id?.toString() === user._id?.toString());

  // Update textarea if parent user.bio changes
  useEffect(() => {
    setBio(user.bio || "");
  }, [user]);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?._id && !user?.id) return;
      
      try {
        const userId = user._id || user.id;
        const res = await fetch(`${API_URL}/auth/user/${userId}`);
        const data = await res.json();
        if (res.ok) {
          setProfileUser(data.user);
          // Check if current user is following this user
          if (currentUser && data.user.followers) {
            const following = data.user.followers.some(f => 
              f._id?.toString() === currentUser._id?.toString() || 
              f.toString() === currentUser._id?.toString()
            );
            setIsFollowing(following);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [user, currentUser]);

  // Fetch user's posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user?._id && !user?.id) {
        setLoadingPosts(false);
        return;
      }
      
      try {
        setLoadingPosts(true);
        const userId = user._id || user.id;
        const res = await fetch(`${API_URL}/posts?creatorId=${userId}`);
        const data = await res.json();
        if (res.ok) {
          setUserPosts(data || []);
        }
      } catch (err) {
        console.error("Error fetching user posts:", err);
        setUserPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchUserPosts();
  }, [user]);

  const handleFollow = async () => {
    if (!currentUser) {
      alert("Please log in to follow users");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userId = user._id || user.id;
      const res = await fetch(`${API_URL}/auth/follow/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(!isFollowing);
        // Refresh profile
        const profileRes = await fetch(`${API_URL}/auth/user/${userId}`);
        const profileData = await profileRes.json();
        if (profileRes.ok) {
          setProfileUser(profileData.user);
        }
      }
    } catch (err) {
      console.error("Error following user:", err);
    }
  };

  const handleSave = async () => {
    if (bio.trim() === user.bio) return; // nothing changed
    await onSaveBio(bio); // call parent
    setSuccessMessage("Bio updated successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleUpdateAccount = async () => {
    if (!isOwnProfile) return;
    if (!username.trim()) {
      setAccountError("Username cannot be empty");
      return;
    }

    if (!currentPassword && newPassword) {
      setAccountError("Enter your current password to set a new one");
      return;
    }

    setAccountError("");
    setAccountSuccess("");
    setUpdatingAccount(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAccountError("You must be logged in");
        setUpdatingAccount(false);
        return;
      }

      const res = await fetch(`${API_URL}/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAccountError(data.error || "Failed to update profile");
      } else {
        setAccountSuccess("Account updated successfully!");
        setProfileUser((prev) => ({ ...prev, username: data.user.username }));
        setCurrentPassword("");
        setNewPassword("");
        setTimeout(() => setAccountSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error updating account:", err);
      setAccountError("Failed to update profile");
    } finally {
      setUpdatingAccount(false);
    }
  };

  return (
    <div className="page profile-page">
      <div className="profile-header">
        <h2>{profileUser.username}'s Profile</h2>
        {!isOwnProfile && currentUser && (
          <button
            className={`follow-btn ${isFollowing ? "following" : ""}`}
            onClick={handleFollow}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>
      {profileUser.followers && (
        <div className="profile-stats">
          <span>{profileUser.followers.length} followers</span>
          <span>{profileUser.following?.length || 0} following</span>
        </div>
      )}

      {/* ACCOUNT & BIO SECTION */}
      {isOwnProfile ? (
        <>
          <div className="profile-section">
            <h3>Account Settings</h3>
            <div className="account-field">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="account-field">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password (only needed if changing password)"
              />
            </div>
            <div className="account-field">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (optional)"
              />
            </div>
            {accountError && <p className="error-message">{accountError}</p>}
            {accountSuccess && <p className="success-message">{accountSuccess}</p>}
            <button
              onClick={handleUpdateAccount}
              disabled={updatingAccount || (!newPassword && username === user.username)}
            >
              {updatingAccount ? "Updating..." : "Update Account"}
            </button>
          </div>

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
              Save Bio
            </button>
            {successMessage && <p className="success-message">{successMessage}</p>}
          </div>
        </>
      ) : (
        <div className="profile-section">
          <label>Bio</label>
          <p>{profileUser.bio || "This user hasn't written a bio yet."}</p>
        </div>
      )}

      {/* COMMUNITIES */}
      <div className="profile-section">
        <h3>{isOwnProfile ? "Your Joined Communities" : "Joined Communities"}</h3>
        {user.joinedCommunities?.length ? (
          <ul>
            {user.joinedCommunities.map((name, i) => (
              <li key={i}>r/{name}</li>
            ))}
          </ul>
        ) : (
          <p>{isOwnProfile ? "You haven't joined any communities yet." : "This user hasn't joined any communities yet."}</p>
        )}
      </div>

      {/* POSTS */}
      <div className="profile-section">
        <h3>{isOwnProfile ? "Your Posts" : "Posts"}</h3>
        {loadingPosts ? (
          <p>Loading posts...</p>
        ) : userPosts.length ? (
          userPosts.map((post) => {
            const voteCount = (post.upvotes?.length || 0) - (post.downvotes?.length || 0);
            return (
              <div key={post._id || post.id} className="profile-post">
                <h4>{post.title}</h4>
                <p className="profile-post-content">{post.content?.slice(0, 140) || ""}{post.content?.length > 140 ? "..." : ""}</p>
                <div className="profile-post-meta">
                  <span className="profile-post-stats">{voteCount} votes</span>
                  <span className="profile-post-stats">{post.comments?.length || 0} comments</span>
                  {post.communityId?.name && (
                    <span className="profile-post-community">r/{post.communityId.name}</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p>{isOwnProfile ? "You haven't made any posts yet." : "This user hasn't made any posts yet."}</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
