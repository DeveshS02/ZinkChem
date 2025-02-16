import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // Authentication state.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // "login" or "register"
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '', // Used for registration.
    password: '',
  });
  const [authError, setAuthError] = useState('');
  const [token, setToken] = useState('');

  // Compound Explorer state.
  const [compounds, setCompounds] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({
    logp_min: '',
    logp_max: '',
    solubility: '',
    qed_min: '',
    qed_max: '',
    sas_min: '',
    sas_max: '',
    smile: ''
  });
  const [activeTab, setActiveTab] = useState("results");

  // Create an Axios instance with a base URL.
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000'
  });

  // Attach the JWT token to every request if available.
  axiosInstance.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // ---------------------------
  // Persist token on reload
  // ---------------------------
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (storedToken && storedUsername) {
      setToken(storedToken);
      setAuthForm((prev) => ({ ...prev, username: storedUsername }));
      setIsAuthenticated(true);
    }
  }, []);

  // ---------------------------
  // Authentication Functions
  // ---------------------------
  const handleAuthInputChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        const res = await axiosInstance.post('/login', {
          username: authForm.username,
          password: authForm.password,
        });
        const receivedToken = res.data.access_token;
        setToken(receivedToken);
        setIsAuthenticated(true);
        // Store token and username in localStorage.
        localStorage.setItem('token', receivedToken);
        localStorage.setItem('username', authForm.username);
      } else {
        const res = await axiosInstance.post('/register', {
          username: authForm.username,
          email: authForm.email,
          password: authForm.password,
        });
        const receivedToken = res.data.access_token;
        setToken(receivedToken);
        setIsAuthenticated(true);
        localStorage.setItem('token', receivedToken);
        localStorage.setItem('username', authForm.username);
      }
    } catch (error) {
      setAuthError(error.response?.data.detail || "Authentication failed");
    }
  };

  // Logout function clears token from state and localStorage.
  const handleLogout = () => {
    setToken('');
    setIsAuthenticated(false);
    setAuthForm({ username: '', email: '', password: '' });
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  // ---------------------------
  // Compound & Favorites Functions
  // ---------------------------
  const fetchCompounds = async () => {
    try {
      const params = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });
      const res = await axiosInstance.get('/compounds', { params });
      setCompounds(res.data);
    } catch (error) {
      console.error("Error fetching compounds:", error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await axiosInstance.get('/favorites');
      setFavorites(res.data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated, token]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCompounds();
    setActiveTab("results");
  };

  const handleClear = () => {
    setCompounds([]);
  };

  const addFavorite = async (compoundId) => {
    try {
      await axiosInstance.post('/favorites', { compound_id: compoundId });
      fetchFavorites();
    } catch (error) {
      console.error("Error adding favorite:", error);
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      await axiosInstance.delete(`/favorites/${favoriteId}`);
      fetchFavorites();
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  // ---------------------------
  // Render Authentication Form if not logged in
  // ---------------------------
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <h1>{authMode === 'login' ? "Login" : "Register"}</h1>
        <form onSubmit={handleAuthSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              name="username" 
              value={authForm.username} 
              onChange={handleAuthInputChange} 
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
                onChange={handleAuthInputChange} 
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
              onChange={handleAuthInputChange} 
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
              <button className="btn secondary" onClick={() => { setAuthMode('register'); setAuthError(''); }}>
                Register
              </button>
            </>
          ) : (
            <>
              <p>Already have an account?</p>
              <button className="btn secondary" onClick={() => { setAuthMode('login'); setAuthError(''); }}>
                Login
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------
  // Render Main App (Compound Explorer) once authenticated
  // ---------------------------
  return (
    <div className="app-container">
      <header className="header">
        <h1>Chemical Compound Explorer</h1>
        <div className="user-id">
          <p>Logged in as: <strong>{authForm.username}</strong></p>
          <button className="btn secondary" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <h2>Search Filters</h2>
          <form onSubmit={handleSearch}>
            <div className="form-group">
              <label>logP Range</label>
              <div className="input-row">
                <input type="number" step="any" name="logp_min" value={filters.logp_min} onChange={handleFilterChange} placeholder="Min" />
                <input type="number" step="any" name="logp_max" value={filters.logp_max} onChange={handleFilterChange} placeholder="Max" />
              </div>
            </div>
            <div className="form-group">
              <label>Solubility</label>
              <input type="text" name="solubility" value={filters.solubility} onChange={handleFilterChange} placeholder="good or poor" />
            </div>
            <div className="form-group">
              <label>QED Range</label>
              <div className="input-row">
                <input type="number" step="any" name="qed_min" value={filters.qed_min} onChange={handleFilterChange} placeholder="Min" />
                <input type="number" step="any" name="qed_max" value={filters.qed_max} onChange={handleFilterChange} placeholder="Max" />
              </div>
            </div>
            <div className="form-group">
              <label>SAS Range</label>
              <div className="input-row">
                <input type="number" step="any" name="sas_min" value={filters.sas_min} onChange={handleFilterChange} placeholder="Min" />
                <input type="number" step="any" name="sas_max" value={filters.sas_max} onChange={handleFilterChange} placeholder="Max" />
              </div>
            </div>
            <div className="form-group">
              <label>SMILES Search</label>
              <input type="text" name="smile" value={filters.smile} onChange={handleFilterChange} placeholder="Enter SMILES" />
            </div>
            <div className="button-row">
              <button type="submit" className="btn primary">Search</button>
              <button type="button" onClick={handleClear} className="btn secondary">Clear</button>
            </div>
          </form>
        </aside>

        <section className="content-area">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === "results" ? "active" : ""}`} 
              onClick={() => setActiveTab("results")}
            >
              Search Results
            </button>
            <button 
              className={`tab ${activeTab === "favorites" ? "active" : ""}`} 
              onClick={() => setActiveTab("favorites")}
            >
              Favorites
            </button>
          </div>

          {activeTab === "results" && (
            <div className="results">
              {compounds.length === 0 ? (
                <p className="placeholder">No results to display. Enter search criteria and click Search.</p>
              ) : (
                <div className="card-container">
                  {compounds.map(comp => (
                    <div key={comp.id} className="compound-card">
                      <h3>{comp.smiles}</h3>
                      <p><strong>logP:</strong> {comp.logP}</p>
                      <p><strong>QED:</strong> {comp.qed}</p>
                      <p><strong>SAS:</strong> {comp.sas}</p>
                      <p><strong>Formula:</strong> {comp.molecular_formula}</p>
                      <p><strong>M.W.:</strong> {comp.molecular_weight.toFixed(2)}</p>
                      <p><strong>IUPAC:</strong> {comp.iupac_name}</p>
                      <div className="structure">
                        <img 
                          src={`data:image/png;base64,${comp.structure_image}`} 
                          alt="structure" 
                        />
                      </div>
                      <button className="btn primary" onClick={() => addFavorite(comp.id)}>Add to Favorites</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="results">
              {favorites.length === 0 ? (
                <p className="placeholder">No favorites yet.</p>
              ) : (
                <div className="card-container">
                  {favorites.map(comp => (
                    <div key={comp.id} className="compound-card">
                      <h3>{comp.smiles}</h3>
                      <p><strong>logP:</strong> {comp.logP}</p>
                      <p><strong>QED:</strong> {comp.qed}</p>
                      <p><strong>SAS:</strong> {comp.sas}</p>
                      <p><strong>Formula:</strong> {comp.molecular_formula}</p>
                      <p><strong>M.W.:</strong> {comp.molecular_weight.toFixed(2)}</p>
                      <p><strong>IUPAC:</strong> {comp.iupac_name}</p>
                      <div className="structure">
                        <img 
                          src={`data:image/png;base64,${comp.structure_image}`} 
                          alt="structure" 
                        />
                      </div>
                      <button className="btn danger" onClick={() => removeFavorite(comp.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
