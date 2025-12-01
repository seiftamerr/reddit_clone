import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CommunityPage from "./components/CommunityPage";
import CreateCommunityPage from "./components/CreateCommunityPage";
import CreatePostPage from "./components/CreatePostPage";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import ProfilePage from "./components/ProfilePage";
import PostPage from "./components/PostPage";
import { API_URL } from "./config";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);

  const token = localStorage.getItem("token");

  // Fetch logged-in user and communities
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setUser(data.user);
            setIsLoggedIn(true);
          }
        })
        .catch(console.error);
    }

    fetchCommunities();
  }, []);

  const fetchCommunities = () => {
    fetch(`${API_URL}/communities`)
      .then((res) => res.json())
      .then((data) => setCommunities(data))
      .catch(() => setCommunities([]));
  };

  const goHome = () => {
    setPage("home");
    setSelectedCommunity(null);
    setSelectedPost(null);
    fetchCommunities();
  };

  const openCommunity = (community) => {
    fetch(`${API_URL}/communities/${community._id}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedCommunity(data);
        setSelectedPost(null);
        setPage("community");
      });
  };

  const openPost = (post) => {
    setSelectedPost(post);
    setPage("post");
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsLoggedIn(false);
    setPage("home");
  };

  const searchResults = communities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // CREATE COMMUNITY
  const createCommunity = async (name, description = "") => {
    try {
      const res = await fetch(`${API_URL}/communities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      setCommunities([...communities, data]);
      setSelectedCommunity(data);
      setPage("community");
    } catch (err) {
      console.error(err);
    }
  };

  // JOIN / LEAVE COMMUNITY
  const toggleMembership = async (communityId) => {
    try {
      const res = await fetch(`${API_URL}/communities/${communityId}/join`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      setSelectedCommunity(data.community);
      setCommunities(
        communities.map((c) => (c._id === communityId ? data.community : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // CREATE POST
  const createPost = async (communityId, title, content) => {
    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, communityId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      // Refresh community to include new post
      openCommunity({ _id: communityId });
    } catch (err) {
      console.error(err);
    }
  };

  // VOTE POST
  const votePost = async (postId, vote) => {
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/vote`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vote }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      // Refresh community posts
      if (selectedCommunity) openCommunity(selectedCommunity);
      if (selectedPost) openPost(selectedPost);
    } catch (err) {
      console.error(err);
    }
  };

  // ADD COMMENT
  const addComment = async (postId, text) => {
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      // Refresh post and community
      if (selectedCommunity) openCommunity(selectedCommunity);
      if (selectedPost) openPost(selectedPost);
    } catch (err) {
      console.error(err);
    }
  };

  // UPDATE BIO
  const onSaveBio = async (newBio) => {
    try {
      if (!token) return;
      const res = await fetch(`${API_URL}/auth/update-bio`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio: newBio }),
      });
      const data = await res.json();
      if (!data.error) setUser(data.user);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <Header
        onLogoClick={goHome}
        onLoginClick={() => setPage("login")}
        onProfileClick={() => setPage("profile")}
        onSearch={(q) => setSearchQuery(q)}
        isLoggedIn={isLoggedIn}
      />

      <div className="main-container">
        <Sidebar
          communities={communities}
          onHomeClick={goHome}
          onCreateCommunity={() => setPage("create-community")}
          onSelectCommunity={openCommunity}
          onProfileClick={() => setPage("profile")}
          onLogout={logoutUser}
        />

        <div className="content">
          {page === "home" && (
            <div className="posts-container">
              <h2>Trending Communities</h2>
              {communities.map((c) => (
                <div key={c._id} className="post">
                  <h4>r/{c.name}</h4>
                  <p>{c.members.length} members</p>
                  <button onClick={() => openCommunity(c)}>View</button>
                </div>
              ))}
            </div>
          )}

          {searchQuery !== "" && page === "home" && (
            <>
              <h3>Search Results</h3>
              {searchResults.map((c) => (
                <div key={c._id} className="post">
                  <h4>r/{c.name}</h4>
                  <button onClick={() => openCommunity(c)}>Open</button>
                </div>
              ))}
            </>
          )}

          {page === "login" && (
            <LoginPage
              onSignUpClick={() => setPage("signup")}
              onSuccess={(userData) => {
                setUser(userData);
                setIsLoggedIn(true);
                setPage("home");
              }}
            />
          )}

          {page === "signup" && (
            <SignUpPage
              onLoginClick={() => setPage("login")}
              onSuccess={(userData) => {
                setUser(userData);
                setIsLoggedIn(true);
                setPage("home");
              }}
            />
          )}

          {page === "profile" && user && (
            <ProfilePage
              user={user}
              posts={communities.flatMap((c) => c.posts)}
              onSaveBio={onSaveBio}
            />
          )}

          {page === "create-community" && (
            <CreateCommunityPage onCreate={createCommunity} />
          )}

          {page === "community" && selectedCommunity && (
            <CommunityPage
              community={selectedCommunity}
              onJoinLeave={toggleMembership}
              onCreatePost={() => setPage("create-post")}
              onViewPost={openPost}
            />
          )}

          {page === "create-post" && selectedCommunity && (
            <CreatePostPage
              community={selectedCommunity}
              onCreate={createPost}
            />
          )}

          {page === "post" && selectedPost && (
            <PostPage
              post={selectedPost}
              onBack={() => setPage("community")}
              onVote={votePost}
              onAddComment={addComment}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
