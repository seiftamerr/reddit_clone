import React, { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CommunityPage from "./components/CommunityPage";
import CreateCommunityPage from "./components/CreateCommunityPage";
import CreatePostPage from "./components/CreatePostPage";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [communities, setCommunities] = useState([
    { id: 1, name: "ReactJS", members: 12, posts: [], joined: false },
    { id: 2, name: "Gaming", members: 44, posts: [], joined: false },
  ]);

  const goHome = () => {
    setPage("home");
    setSelectedCommunity(null);
  };

  const openCommunity = (community) => {
    setSelectedCommunity(community);
    setPage("community");
  };

  const createCommunity = (name) => {
    const newComm = {
      id: Date.now(),
      name,
      members: 1,
      posts: [],
      joined: true,
    };
    setCommunities([...communities, newComm]);
    setSelectedCommunity(newComm);
    setPage("community");
  };

  const toggleMembership = (id) => {
    const updated = communities.map((c) =>
      c.id === id
        ? { ...c, members: c.joined ? c.members - 1 : c.members + 1, joined: !c.joined }
        : c
    );
    setCommunities(updated);

    if (selectedCommunity && selectedCommunity.id === id) {
      setSelectedCommunity(updated.find((c) => c.id === id));
    }
  };

  const createPost = (communityId, title, content) => {
    const updated = communities.map((c) =>
      c.id === communityId
        ? { ...c, posts: [...c.posts, { id: Date.now(), title, content, author: "Seif" }] }
        : c
    );
    setCommunities(updated);

    if (selectedCommunity && selectedCommunity.id === communityId) {
      setSelectedCommunity(updated.find((c) => c.id === communityId));
    }

    setPage("community");
  };

  return (
    <div>
      {/* Header always visible */}
      <Header
        onLogoClick={goHome}
        onLoginClick={() => setPage("login")}
        isLoggedIn={isLoggedIn}
      />

      <div className="main-container">
        {/* Sidebar always visible */}
        <Sidebar
          communities={communities}
          onHomeClick={goHome}
          onCreateCommunity={() => setPage("create-community")}
          onSelectCommunity={openCommunity}
        />

        <div className="content">
          {/* HOME */}
          {page === "home" && (
            <div className="posts-container">
              <h2 style={{ marginBottom: "20px" }}>Home</h2>
              {communities.map((c) => (
                <div key={c.id} className="post">
                  <h4>r/{c.name}</h4>
                  <p>{c.members} members</p>
                  <button onClick={() => openCommunity(c)}>View Community</button>
                </div>
              ))}
            </div>
          )}

          {/* LOGIN */}
          {page === "login" && <LoginPage onSignUpClick={() => setPage("signup")} />}

          {/* SIGNUP */}
          {page === "signup" && <SignUpPage onLoginClick={() => setPage("login")} />}

          {/* CREATE COMMUNITY */}
          {page === "create-community" && (
            <CreateCommunityPage onCreate={createCommunity} />
          )}

          {/* COMMUNITY PAGE */}
          {page === "community" && selectedCommunity && (
            <CommunityPage
              community={selectedCommunity}
              onJoinLeave={toggleMembership}
              onCreatePost={() => setPage("create-post")}
            />
          )}

          {/* CREATE POST PAGE */}
          {page === "create-post" && selectedCommunity && (
            <CreatePostPage
              community={selectedCommunity}
              onCreate={createPost}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
