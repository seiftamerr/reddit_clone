import React, { useState } from "react";
import Header from "./components/Header";
import Post from "./components/Post";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import Sidebar from "./components/Sidebar";
import "./App.css";

function App() {
  const [page, setPage] = useState("home"); // 'home', 'login', 'signup'

  const posts = [
    {
      id: 1,
      title: "Hello Reddit Clone!",
      content: "This is my first post.",
      author: "Seif",
    },
    {
      id: 2,
      title: "Another Post",
      content: "Learning React is fun.",
      author: "Seif",
    },
  ];

  const goHome = () => setPage("home");

  return (
    <div>
      {/* Header is always visible */}
      <Header onLoginClick={() => setPage("login")} onLogoClick={goHome} />

      {/* Login Page */}
      {page === "login" && (
        <LoginPage onSignUpClick={() => setPage("signup")} />
      )}

      {/* Sign Up Page */}
      {page === "signup" && (
        <SignUpPage onLoginClick={() => setPage("login")} />
      )}

      {/* Home Page */}
      {page === "home" && (
        <div className="main-container">
          <Sidebar />
          <div className="posts-container">
            {posts.map((post) => (
              <Post
                key={post.id}
                title={post.title}
                content={post.content}
                author={post.author}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
