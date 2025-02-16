// src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CompoundCard from './components/CompoundCard';
import AuthForm from './components/AuthForm';
import { loginSuccess } from './redux/authSlice';
import './App.css';

const App = () => {
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Compound explorer states
  const [compounds, setCompounds] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('results');
  const [filters, setFilters] = useState({
    logp_min: '',
    logp_max: '',
    solubility: '',
    qed_min: '',
    qed_max: '',
    druglikeness: '',         // New: high/moderate/low
    sas_min: '',
    sas_max: '',
    synthesizability: '',     // New: easy/moderate/hard
    smile: '',
  });
  

  // Axios instance for protected endpoints (uses token from Redux)
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
      Authorization: auth.token ? `Bearer ${auth.token}` : '',
    },
  });

  // ---------------------------
  // Authentication Handler
  // ---------------------------
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        // Login endpoint
        const res = await axios.post('http://localhost:8000/login', {
          username: authForm.username,
          password: authForm.password,
        });
        if (res.data.access_token) {
          dispatch(loginSuccess({ token: res.data.access_token, username: authForm.username }));
        } else {
          setAuthError("Login did not return a token.");
        }
      } else {
        // Register endpoint
        const res = await axios.post('http://localhost:8000/register', {
          username: authForm.username,
          email: authForm.email,
          password: authForm.password,
        });
        if (res.data.access_token) {
          dispatch(loginSuccess({ token: res.data.access_token, username: authForm.username }));
        } else {
          setAuthError("Registration did not return a token.");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError(error.response?.data.detail || "Authentication failed");
    }
  };

  // ---------------------------
  // Compound Explorer Functions
  // ---------------------------
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      logp_min: '',
      logp_max: '',
      solubility: '',
      qed_min: '',
      qed_max: '',
      sas_min: '',
      sas_max: '',
      smile: '',
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const params = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params[key] = filters[key];
      });
      const res = await axiosInstance.get('/compounds', { params });
      setCompounds(res.data);
      setActiveTab('results');
    } catch (error) {
      console.error('Error fetching compounds:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await axiosInstance.get('/favorites');
      setFavorites(res.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchFavorites();
    }
  }, [auth.isAuthenticated, auth.token]);

  const addFavorite = async (compoundId) => {
    try {
      await axiosInstance.post('/favorites', { compound_id: compoundId });
      fetchFavorites();
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      await axiosInstance.delete(`/favorites/${favoriteId}`);
      fetchFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };  
  

  // ---------------------------
  // Conditional Rendering
  // ---------------------------
  // If not authenticated, show AuthForm with our login/register logic.
  if (!auth.isAuthenticated) {
    return (
      <div className="app-container">
        <AuthForm
          authMode={authMode}
          authForm={authForm}
          onChange={(e) => setAuthForm({ ...authForm, [e.target.name]: e.target.value })}
          onSubmit={handleAuthSubmit}
          authError={authError}
          toggleAuthMode={() => {
            setAuthMode(authMode === 'login' ? 'register' : 'login');
            setAuthError('');
          }}
        />
      </div>
    );
  }

  // Main App when authenticated
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <Sidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onClearFilters={clearFilters}
        />
        <section className="content-area">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              Search Results
            </button>
            <button
              className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              Favorites
            </button>
          </div>
          
          {activeTab === 'results' && (
          <div className="card-container">
            {compounds.length === 0 ? (
              <p className="placeholder">
                No results to display. Enter search criteria and click Search.
              </p>
            ) : (
              compounds.map((compound) => {
                // Find favorite entry for this compound if it exists.
                const favEntry = favorites.find((fav) => fav.id === compound.id);
                return (
                  <CompoundCard
                    key={compound.id}
                    compound={compound}
                    favoriteId={favEntry ? favEntry.favorite_id : null}
                    onAddFavorite={addFavorite}
                    onRemoveFavorite={removeFavorite}
                    isFavorite={!!favEntry}
                  />
                );
              })
            )}
          </div>
          )}


          {activeTab === 'favorites' && (
            <div className="card-container">
              {favorites.length === 0 ? (
                <p className="placeholder">No favorites yet.</p>
              ) : (
                favorites.map((compound) => (
                  <CompoundCard
                    key={compound.id}
                    compound={compound}
                    favoriteId={compound.favorite_id}
                    onAddFavorite={addFavorite}
                    onRemoveFavorite={removeFavorite}
                    isFavorite={true}
                  />
                ))
              )}
            </div>
          )}

        </section>
      </div>
    </div>
  );
};

export default App;