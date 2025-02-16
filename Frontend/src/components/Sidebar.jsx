// src/components/Sidebar.jsx
import React from 'react';

const Sidebar = ({ filters, onFilterChange, onSearch, onClearFilters }) => {
  return (
    <aside className="sidebar">
      <h2>Search Filters</h2>
      <form onSubmit={onSearch}>
        <div className="form-group">
          <label>logP Range (Solubility)</label>
          <div className="input-row">
            <input type="number" step="any" name="logp_min" value={filters.logp_min} onChange={onFilterChange} placeholder="Min" />
            <input type="number" step="any" name="logp_max" value={filters.logp_max} onChange={onFilterChange} placeholder="Max" />
          </div>
          <select name="solubility" value={filters.solubility} onChange={onFilterChange}>
            <option value="">-- Select Solubility --</option>
            <option value="good">Good (0 to 3)</option>
            <option value="poor">Poor (above 3)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Drug Likeness (QED)</label>
          <div className="input-row">
            <input type="number" step="any" name="qed_min" value={filters.qed_min} onChange={onFilterChange} placeholder="Min" />
            <input type="number" step="any" name="qed_max" value={filters.qed_max} onChange={onFilterChange} placeholder="Max" />
          </div>
          <select name="druglikeness" value={filters.druglikeness} onChange={onFilterChange}>
            <option value="">-- Select Drug Likeness --</option>
            <option value="high">High (&gt; 0.67)</option>
            <option value="moderate">Moderate (0.5 - 0.67)</option>
            <option value="low">Low (≤ 0.5)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Synthesizability (SAS)</label>
          <div className="input-row">
            <input type="number" step="any" name="sas_min" value={filters.sas_min} onChange={onFilterChange} placeholder="Min" />
            <input type="number" step="any" name="sas_max" value={filters.sas_max} onChange={onFilterChange} placeholder="Max" />
          </div>
          <select name="synthesizability" value={filters.synthesizability} onChange={onFilterChange}>
            <option value="">-- Select Synthesizability --</option>
            <option value="easy">Easy (1-3)</option>
            <option value="moderate">Moderate (3-6)</option>
            <option value="hard">Hard (&gt; 6)</option>
          </select>
        </div>

        <div className="form-group">
          <label>SMILES Search</label>
          <input type="text" name="smile" value={filters.smile} onChange={onFilterChange} placeholder="Enter SMILES" />
        </div>

        <div className="reference">
          <h4>Reference Ranges:</h4>
          <p><strong>Solubility (logP):</strong> Good: 0-3, Poor: &gt;3</p>
          <p><strong>Drug Likeness (QED):</strong> High: &gt;0.67, Moderate: 0.5-0.67, Low: ≤0.5</p>
          <p><strong>Synthesizability (SAS):</strong> Easy: 1-3, Moderate: 3-6, Hard: &gt;6</p>
        </div>

        <div className="button-row">
          <button type="submit" className="btn primary">Search</button>
          <button type="button" onClick={onClearFilters} className="btn secondary">Clear Filters</button>
        </div>
      </form>
    </aside>
  );
};

export default Sidebar;
