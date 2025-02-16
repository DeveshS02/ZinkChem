// src/redux/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('token');
const username = localStorage.getItem('username');

const initialState = {
  isAuthenticated: !!token,
  token: token || '',
  username: username || '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action) {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.username = action.payload.username;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('username', action.payload.username);
    },
    logout(state) {
      state.isAuthenticated = false;
      state.token = '';
      state.username = '';
      localStorage.removeItem('token');
      localStorage.removeItem('username');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
