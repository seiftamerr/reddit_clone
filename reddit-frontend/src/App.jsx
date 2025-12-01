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

  // Fetch logged-in user and communities on load
  useEffect(() => {
    const token = localStorage.getItem("token");
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

    fetch(`${API_URL}/communities`)
      .then((res) => res.json())
      .then((data) => setCommunities(data))
      .catch(() => setCommunities([]));
  }, []);

  const goHome = () => {
    setPage("home");
    setSelectedCommunity(null);
    setSelectedPost(null);
  };

  const openCommunity = (community) => {
    setSelectedCommunity(community);
    setSelectedPost(null);
    setPage("community");
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

  const createCommunity = (name) => {
    const newComm = { id: Date.now(), name, members: 1, joined: true, posts: [] };
    setCommunities([...communities, newComm]);
    setUser({
      ...user,
      joinedCommunities: [...(user?.joinedCommunities || []), name],
    });
    setSelectedCommunity(newComm);
    setPage("community");
  };

  const toggleMembership = (communityId) => {
    const updated = communities.map((c) => {
      if (c.id !== communityId) return c;
      const isJoining = !c.joined;
      if (isJoining) {
        setUser({
          ...user,
          joinedCommunities: [...(user?.joinedCommunities || []), c.name],
        });
      } else {
        setUser({
          ...user,
          joinedCommunities: (user?.joinedCommunities || []).filter(
            (name) => name !== c.name
          ),
        });
      }
      return {
        ...c,
        joined: isJoining,
        members: isJoining ? c.members + 1 : c.members - 1,
      };
    });
    setCommunities(updated);
    setSelectedCommunity(updated.find((c) => c.id === communityId));
  };

  const createPost = (communityId, title, content) => {
    const updated = communities.map((c) => {
      if (c.id !== communityId) return c;
      return {
        ...c,
        posts: [
          ...c.posts,
          {
            id: Date.now(),
            title,
            content,
            author: user.username,
            votes: 0,
            userVote: 0,
            comments: [],
          },
        ],
      };
    });
    setCommunities(updated);
    setSelectedCommunity(updated.find((c) => c.id === communityId));
    setPage("community");
  };

  const votePost = (postId, delta) => {
    const updated = communities.map((c) => {
      if (c.id !== selectedCommunity.id) return c;
      return {
        ...c,
        posts: c.posts.map((p) => {
          if (p.id !== postId) return p;
          const newVote = p.userVote === delta ? 0 : delta;
          return {
            ...p,
            userVote: newVote,
            votes: p.votes - p.userVote + newVote,
          };
        }),
      };
    });
    setCommunities(updated);
    const updatedComm = updated.find((c) => c.id === selectedCommunity.id);
    setSelectedCommunity(updatedComm);
    setSelectedPost(updatedComm.posts.find((p) => p.id === postId));
  };

  const addComment = (postId, text) => {
    const updated = communities.map((c) => {
      if (c.id !== selectedCommunity.id) return c;
      return {
        ...c,
        posts: c.posts.map((p) =>
          p.id === postId
            ? { ...p, comments: [...p.comments, { id: Date.now(), text, author: user.username }] }
            : p
        ),
      };
    });
    setCommunities(updated);
    const updatedComm = updated.find((x) => x.id === selectedCommunity.id);
    setSelectedCommunity(updatedComm);
    setSelectedPost(updatedComm.posts.find((p) => p.id === postId));
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
          {/* HOME */}
          {page === "home" && (
            <div className="posts-container">
              <h2>Trending Communities</h2>
              {communities.map((c) => (
                <div key={c.id} className="post">
                  <h4>r/{c.name}</h4>
                  <p>{c.members} members</p>
                  <button onClick={() => openCommunity(c)}>View</button>
                </div>
              ))}
            </div>
          )}

          {searchQuery !== "" && page === "home" && (
            <>
              <h3>Search Results</h3>
              {searchResults.map((c) => (
                <div key={c.id} className="post">
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
              onSaveBio={(newBio) => setUser({ ...user, bio: newBio })}
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
            <CreatePostPage community={selectedCommunity} onCreate={createPost} />
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
