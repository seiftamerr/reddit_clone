import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  const [viewingUser, setViewingUser] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [postSort, setPostSort] = useState("new");
  const [previousPage, setPreviousPage] = useState("home");

  const token = localStorage.getItem("token");

  const fetchCommunities = () => {
    fetch(`${API_URL}/communities`)
      .then((res) => res.json())
      .then((data) => setCommunities(data))
      .catch(() => setCommunities([]));
  };

  const fetchAllPosts = useCallback(() => {
    fetch(`${API_URL}/posts?sort=${postSort}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllPosts(data);
        }
      })
      .catch(() => setAllPosts([]));
  }, [postSort]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch posts when sort changes or page changes to home
  useEffect(() => {
    if (page === "home") {
      fetchAllPosts();
    }
  }, [postSort, page, fetchAllPosts]);

  const refreshUser = useCallback(() => {
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setUser(data.user);
          }
        })
        .catch(console.error);
    }
  }, [token]);

  const goHome = () => {
    setPage("home");
    setSelectedCommunity(null);
    setSelectedPost(null);
    setViewingUser(null);
    fetchCommunities();
  };

  const openUserProfile = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/auth/user/${userId}`);
      const data = await res.json();
      if (res.ok) {
        setViewingUser(data.user);
        setPage("profile");
      } else {
        alert(data.error || "Failed to load user profile");
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      alert("Failed to load user profile");
    }
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

  const openPost = async (post) => {
    try {
      // Store current page before opening post
      setPreviousPage(page);
      // Fetch full post with populated comments
      const res = await fetch(`${API_URL}/posts/${post._id}`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to load post");
        return;
      }
      setSelectedPost(data);
      setPage("post");
    } catch (err) {
      console.error(err);
      // Fallback to using the post data we have
      setPreviousPage(page);
      setSelectedPost(post);
      setPage("post");
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsLoggedIn(false);
    setPage("home");
  };

  const [searchResults, setSearchResults] = useState({ communities: [], posts: [], users: [] });

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults({ communities: [], posts: [], users: [] });
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        // Fetch posts and communities
        const postsRes = await fetch(`${API_URL}/posts/search?q=${encodeURIComponent(searchQuery)}`);
        const postsData = await postsRes.json();
        
        // Fetch users
        const usersRes = await fetch(`${API_URL}/auth/search?q=${encodeURIComponent(searchQuery)}`);
        const usersData = await usersRes.json();
        
        if (postsRes.ok && usersRes.ok) {
          setSearchResults({
            communities: postsData.communities || [],
            posts: postsData.posts || [],
            users: usersData.users || []
          });
        }
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

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
      // Refresh user data to update joinedCommunities
      refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  // CREATE POST
  const createPost = async (communityId, title, content, imageUrl = "") => {
    try {
      if (!title) {
        alert("Please enter a title");
        return;
      }
      if (!content && !imageUrl) {
        alert("Please add content or an image");
        return;
      }
      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content: content || "", communityId, imageUrl: imageUrl || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create post");
        return;
      }
      // Refresh community to include new post
      openCommunity({ _id: communityId });
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post. Please try again.");
    }
  };

  // VOTE POST
  const votePost = useCallback(async (postId, vote) => {
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
      // Refresh community posts and selected post
      if (selectedCommunity) {
        const commRes = await fetch(`${API_URL}/communities/${selectedCommunity._id}`);
        const commData = await commRes.json();
        setSelectedCommunity(commData);
      }
      if (selectedPost) {
        const postRes = await fetch(`${API_URL}/posts/${selectedPost._id}`);
        const postData = await postRes.json();
        setSelectedPost(postData);
      }
      // Refresh home page posts
      if (page === "home") {
        fetchAllPosts();
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, selectedCommunity, selectedPost, page, fetchAllPosts]);

  // ADD COMMENT
  const addComment = useCallback(async (postId, text) => {
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
      if (selectedCommunity) {
        const commRes = await fetch(`${API_URL}/communities/${selectedCommunity._id}`);
        const commData = await commRes.json();
        setSelectedCommunity(commData);
      }
      if (selectedPost) {
        const postRes = await fetch(`${API_URL}/posts/${selectedPost._id}`);
        const postData = await postRes.json();
        setSelectedPost(postData);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, selectedCommunity, selectedPost]);

  // EDIT POST
  const editPost = useCallback(async (postId, title, content) => {
    try {
      const res = await fetch(`${API_URL}/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      // Refresh post and community
      if (selectedCommunity) {
        const commRes = await fetch(`${API_URL}/communities/${selectedCommunity._id}`);
        const commData = await commRes.json();
        setSelectedCommunity(commData);
      }
      if (selectedPost) {
        const postRes = await fetch(`${API_URL}/posts/${selectedPost._id}`);
        const postData = await postRes.json();
        setSelectedPost(postData);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, selectedCommunity, selectedPost]);

  // DELETE POST
  const deletePost = useCallback(async (postId) => {
    try {
      const res = await fetch(`${API_URL}/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      // Go back to community or home
      if (selectedCommunity) {
        const commRes = await fetch(`${API_URL}/communities/${selectedCommunity._id}`);
        const commData = await commRes.json();
        setSelectedCommunity(commData);
        setPage("community");
      } else {
        setPage("home");
        fetchAllPosts();
      }
      setSelectedPost(null);
    } catch (err) {
      console.error(err);
    }
  }, [token, selectedCommunity, fetchAllPosts]);

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
        onProfileClick={() => {
          setViewingUser(null);
          setPage("profile");
          refreshUser();
        }}
        onSearch={(q) => setSearchQuery(q)}
        isLoggedIn={isLoggedIn}
      />

      <div className="main-container">
        <Sidebar
          communities={communities}
          onHomeClick={goHome}
          onCreateCommunity={() => {
            if (!user) {
              alert("You need to be signed in to create a community");
              return;
            }
            setPage("create-community");
          }}
          onSelectCommunity={openCommunity}
          onProfileClick={() => {
          setViewingUser(null);
          setPage("profile");
          refreshUser();
        }}
          onLogout={logoutUser}
        />

        <div className="content">
          {page === "home" && (
            <>
              {searchQuery !== "" ? (
                <div className="posts-container">
                  <h2>Search Results for "{searchQuery}"</h2>
                  {searchResults.users?.length > 0 && (
                    <>
                      <h3>Users</h3>
                      {searchResults.users.map((u) => (
                        <div key={u._id} className="post">
                          <h4>u/{u.username}</h4>
                          {u.bio && <p>{u.bio}</p>}
                          <button onClick={() => openUserProfile(u._id)}>View Profile</button>
                        </div>
                      ))}
                    </>
                  )}
                  {searchResults.communities?.length > 0 && (
                    <>
                      <h3>Communities</h3>
                      {searchResults.communities.map((c) => (
                        <div key={c._id} className="post">
                          <h4>r/{c.name}</h4>
                          <p>{c.members?.length || 0} members</p>
                          <button onClick={() => openCommunity(c)}>View</button>
                        </div>
                      ))}
                    </>
                  )}
                  {searchResults.posts?.length > 0 && (
                    <>
                      <h3>Posts</h3>
                      {searchResults.posts.map((p) => {
                        const voteCount = (p.upvotes?.length || 0) - (p.downvotes?.length || 0);
                        const userVote = user ? 
                          (p.upvotes?.some(id => id.toString() === user._id || id._id === user._id) ? 1 :
                           p.downvotes?.some(id => id.toString() === user._id || id._id === user._id) ? -1 : 0)
                          : 0;
                        return (
                          <div key={p._id} className="post">
                            <div className="post-voting" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="vote-btn-small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!user) {
                                    alert("Please log in to vote");
                                    return;
                                  }
                                  const newVote = userVote === 1 ? 0 : 1;
                                  votePost(p._id, newVote);
                                }}
                                style={{
                                  backgroundColor: userVote === 1 ? "var(--vote-up)" : "transparent",
                                  color: userVote === 1 ? "white" : "var(--text-tertiary)",
                                }}
                              >
                                ▲
                              </button>
                              <span className="vote-count-small">{voteCount}</span>
                              <button
                                className="vote-btn-small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!user) {
                                    alert("Please log in to vote");
                                    return;
                                  }
                                  const newVote = userVote === -1 ? 0 : -1;
                                  votePost(p._id, newVote);
                                }}
                                style={{
                                  backgroundColor: userVote === -1 ? "var(--vote-down)" : "transparent",
                                  color: userVote === -1 ? "white" : "var(--text-tertiary)",
                                }}
                              >
                                ▼
                              </button>
                            </div>
                            <div className="post-main" onClick={() => openPost(p)}>
                            <h4>{p.title}</h4>
                              {p.content && <p>{p.content.slice(0, 200)}{p.content.length > 200 ? "..." : ""}</p>}
                              {p.imageUrl && (
                                <div className="post-image-container">
                                  <img src={p.imageUrl} alt={p.title} className="post-image" onClick={(e) => e.stopPropagation()} />
                                </div>
                              )}
                            <div className="post-meta">
                              <span>r/{p.communityId?.name || "Unknown"}</span>
                              <span>
                                By{" "}
                                <button
                                  className="username-link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (p.creatorId?._id) {
                                      openUserProfile(p.creatorId._id);
                                    }
                                  }}
                                >
                                  {p.creatorId?.username || "Unknown"}
                                </button>
                              </span>
                              <span>{voteCount} votes</span>
                              <span>{p.comments?.length || 0} comments</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                  {searchResults.users?.length === 0 && searchResults.communities?.length === 0 && searchResults.posts?.length === 0 && (
                    <p>No results found matching "{searchQuery}"</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="posts-container">
                    <div className="posts-header">
                      <h2>Home</h2>
                      <select
                        value={postSort}
                        onChange={(e) => setPostSort(e.target.value)}
                        className="post-sort-select"
                      >
                        <option value="new">New</option>
                        <option value="top">Top</option>
                      </select>
                    </div>
                    {allPosts.length === 0 ? (
                      <p style={{ padding: "16px", color: "var(--text-secondary)" }}>No posts yet. Join a community and start posting!</p>
                    ) : (
                      allPosts.map((p) => {
                        if (!p || !p._id) return null;
                        const voteCount = (p.upvotes?.length || 0) - (p.downvotes?.length || 0);
                        const userVote = user ? 
                          (p.upvotes?.some(id => id.toString() === user._id || id._id === user._id) ? 1 :
                           p.downvotes?.some(id => id.toString() === user._id || id._id === user._id) ? -1 : 0)
                          : 0;
                        return (
                          <div key={p._id} className="post">
                            <div className="post-voting" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="vote-btn-small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!user) {
                                    alert("Please log in to vote");
                                    return;
                                  }
                                  const newVote = userVote === 1 ? 0 : 1;
                                  votePost(p._id, newVote);
                                }}
                                style={{
                                  backgroundColor: userVote === 1 ? "var(--vote-up)" : "transparent",
                                  color: userVote === 1 ? "white" : "var(--text-tertiary)",
                                }}
                              >
                                ▲
                              </button>
                              <span className="vote-count-small">{voteCount}</span>
                              <button
                                className="vote-btn-small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!user) {
                                    alert("Please log in to vote");
                                    return;
                                  }
                                  const newVote = userVote === -1 ? 0 : -1;
                                  votePost(p._id, newVote);
                                }}
                                style={{
                                  backgroundColor: userVote === -1 ? "var(--vote-down)" : "transparent",
                                  color: userVote === -1 ? "white" : "var(--text-tertiary)",
                                }}
                              >
                                ▼
                              </button>
                            </div>
                            <div className="post-main" onClick={() => openPost(p)}>
                              <h4>{p.title}</h4>
                              {p.content && <p>{p.content.slice(0, 200)}{p.content.length > 200 ? "..." : ""}</p>}
                              {p.imageUrl && (
                                <div className="post-image-container">
                                  <img src={p.imageUrl} alt={p.title} className="post-image" onClick={(e) => e.stopPropagation()} />
                                </div>
                              )}
                              <div className="post-meta">
                                <span>r/{p.communityId?.name || "Unknown"}</span>
                                <span>
                                  By{" "}
                                  <button
                                    className="username-link"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (p.creatorId?._id) {
                                        openUserProfile(p.creatorId._id);
                                      }
                                    }}
                                  >
                                    {p.creatorId?.username || "Unknown"}
                                  </button>
                                </span>
                                <span>{voteCount} votes</span>
                                <span>{p.comments?.length || 0} comments</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="communities-sidebar">
                    <div className="communities-card">
                      <div className="communities-card-header">Top Communities</div>
                      <div className="communities-list">
                        {communities.slice(0, 3).map((c) => (
                          <div
                            key={c._id}
                            className="community-item"
                            onClick={() => openCommunity(c)}
                          >
                            <span className="community-item-name">r/{c.name}</span>
                            <span className="community-item-members">{c.members?.length || 0} members</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
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

          {page === "profile" && (viewingUser || user) && (
            <ProfilePage
              user={viewingUser || user}
              currentUser={user}
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
              onVote={votePost}
              user={user}
              onViewUserProfile={openUserProfile}
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
              onBack={() => {
                // Go back to the previous page
                if (previousPage === "community" && selectedCommunity) {
                  setPage("community");
                } else {
                  setPage("home");
                  if (previousPage !== "community") {
                    setSelectedCommunity(null);
                  }
                  fetchAllPosts();
                }
              }}
              onAddComment={addComment}
              onEditPost={editPost}
              onDeletePost={deletePost}
              user={user}
              onViewUserProfile={openUserProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;