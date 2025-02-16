// src/components/AuthForm.jsx
import React from 'react';

const AuthForm = ({ authMode, authForm, onChange, onSubmit, authError, toggleAuthMode }) => {
  return (
    <div className="auth-container">
      <h1>{authMode === 'login' ? "Login" : "Register"}</h1>
      <form onSubmit={onSubmit} className="auth-form">
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={authForm.username}
            onChange={onChange}
            required
          />
        </div>
        {authMode === 'register' && (
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={authForm.email}
              onChange={onChange}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={authForm.password}
            onChange={onChange}
            required
          />
        </div>
        {authError && <p className="error">{authError}</p>}
        <div className="button-row">
          <button type="submit" className="btn primary">
            {authMode === 'login' ? "Login" : "Register"}
          </button>
        </div>
      </form>
      <div className="toggle-auth">
        {authMode === 'login' ? (
          <>
            <p>Don't have an account?</p>
            <button className="btn secondary" onClick={toggleAuthMode}>
              Register
            </button>
          </>
        ) : (
          <>
            <p>Already have an account?</p>
            <button className="btn secondary" onClick={toggleAuthMode}>
              Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
