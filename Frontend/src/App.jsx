import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // State for compounds, favorites, filters, and user id.
  const [compounds, setCompounds] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [userId, setUserId] = useState("default_user");
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

  // Fetch compounds with current filters.
  const fetchCompounds = async () => {
    try {
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });
      const res = await axios.get('http://localhost:8000/compounds', { params });
      setCompounds(res.data);
    } catch (error) {
      console.error("Error fetching compounds:", error);
    }
  };

  // Fetch favorites for the current user.
  const fetchFavorites = async () => {
    try {
      const res = await axios.get('http://localhost:8000/favorites', { params: { user_id: userId } });
      setFavorites(res.data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  // Update favorites when userId changes.
  useEffect(() => {
    fetchFavorites();
  }, [userId]);

  const handleFilterChange = (e) => {
    setFilters({...filters, [e.target.name]: e.target.value});
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
      await axios.post('http://localhost:8000/favorites', {
        user_id: userId,
        compound_id: compoundId
      });
      fetchFavorites();
    } catch (error) {
      console.error("Error adding favorite:", error);
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      await axios.delete(`http://localhost:8000/favorites/${favoriteId}`, { params: { user_id: userId } });
      fetchFavorites();
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Chemical Compound Explorer</h1>
        <div className="user-id">
          <label>User ID: </label>
          <input 
            type="text" 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)} 
            placeholder="Enter your user id" 
          />
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
