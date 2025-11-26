import React from "react";
import "./SignUpPage.css";

// Accept the onLoginClick prop
export default function SignUpPage({ onLoginClick }) {
  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1 className="signup-title">Sign Up</h1>

        <p className="signup-text">
          Join Reddit Clone to share and connect with communities!
        </p>

        <form className="form-fields">
          <input
            type="text"
            placeholder="Username"
            className="input-field"
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            required
          />
          <textarea
            placeholder="Bio"
            className="input-field bio-field"
            rows="3"
          ></textarea>

          <button type="submit" className="signup-submit">
            Sign Up
          </button>
        </form>

        <p className="login-text">
          Already have an account?{" "}
          <span className="link" onClick={onLoginClick}>
            Log In
          </span>
        </p>
      </div>
    </div>
  );
}
