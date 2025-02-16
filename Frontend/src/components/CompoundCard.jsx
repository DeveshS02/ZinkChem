// src/components/CompoundCard.jsx
import React from 'react';

const CompoundCard = ({ compound, favoriteId, onAddFavorite, onRemoveFavorite, isFavorite }) => {
  return (
    <div className="compound-card">
      <h3 className="compound-smiles">{compound.smiles}</h3>
      <p><strong>logP:</strong> {compound.logP}</p>
      <p><strong>QED:</strong> {compound.qed}</p>
      <p><strong>SAS:</strong> {compound.sas}</p>
      <p><strong>Formula:</strong> {compound.molecular_formula}</p>
      <p><strong>M.W.:</strong> {compound.molecular_weight.toFixed(2)}</p>
      <p><strong>IUPAC:</strong> {compound.iupac_name}</p>
      <div className="structure">
        <img
          src={`data:image/png;base64,${compound.structure_image}`}
          alt="structure"
        />
      </div>
      {isFavorite ? (
        <button
          className="btn danger"
          onClick={() => onRemoveFavorite(favoriteId)}
        >
          Remove Favorite
        </button>
      ) : (
        <button
          className="btn primary"
          onClick={() => onAddFavorite(compound.id)}
        >
          Add to Favorites
        </button>
      )}
    </div>
  );
};

export default CompoundCard;
