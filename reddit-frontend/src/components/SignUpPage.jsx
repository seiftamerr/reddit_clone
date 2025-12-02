import React, { useState } from "react";
import "./SignUpPage.css";
import { API_URL } from "../config";

export default function SignUpPage({ onLoginClick, onSuccess }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // auto login
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername: email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        setError(loginData.error || "Login after signup failed");
        return;
      }

      localStorage.setItem("token", loginData.token);

      // fetch user data
      const userRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });
      const userData = await userRes.json();
      if (userData.error) {
        setError(userData.error);
        return;
      }

      if (onSuccess) onSuccess(userData.user);
    } catch (err) {
      console.error(err);
      setError("Network error, try again.");
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1 className="signup-title">Sign Up</h1>

        <form className="form-fields" onSubmit={handleSignUp}>
          <input 
            type="text" 
            placeholder="Username" 
            className="input-field"
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
          />
          <input 
            type="email" 
            placeholder="Email" 
            className="input-field"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input-field"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="signup-submit">Sign Up</button>
          {error && <p className="error-text">{error}</p>}
        </form>

        <p className="login-text">
          Already have an account? <span className="link" onClick={onLoginClick}>Log In</span>
        </p>
      </div>
    </div>
  );
}
