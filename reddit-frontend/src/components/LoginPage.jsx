import React from "react";
import "./LoginPage.css"; // ← Import the CSS file

// Accept the onSignUpClick prop
export default function LoginPage({ onSignUpClick }) {
  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Log In</h1>

        <p className="login-text">
          By continuing, you agree to our
          <span className="link"> User Agreement </span>
          and acknowledge that you understand the
          <span className="link"> Privacy Policy</span>.
        </p>

        <div className="button-group">
          <button className="login-btn social-btn">
            📱 Continue With Phone Number
          </button>
          <button className="login-btn social-btn">
            🌐 Continue with Google
          </button>
        </div>

        <div className="divider">
          <div className="line"></div>
          <span className="or-text">OR</span>
          <div className="line"></div>
        </div>

        <form className="form-fields">
          <input
            type="text"
            placeholder="Email or username"
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            required
          />

          <a href="#" className="forgot-password">
            Forgot password?
          </a>

          <button type="submit" className="login-submit">
            Log In
          </button>
        </form>

        <p className="signup-text">
          New to Redex?{" "}
          <span className="signup-link" onClick={onSignUpClick}>
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}
