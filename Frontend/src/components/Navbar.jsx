// src/components/Navbar.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';

const Navbar = () => {
  const { isAuthenticated, username } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">Chemical Compound Explorer</div>
      {isAuthenticated && (
        <div className="navbar-user">
          <span>{username}</span>
          <button className="btn secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
