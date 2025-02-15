# db_setup.py
import pandas as pd
from pymongo import MongoClient
from rdkit import Chem
from rdkit.Chem import Descriptors, Draw, rdMolDescriptors
import io
import base64

def compute_properties(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    # Calculate molecular formula and weight.
    formula = rdMolDescriptors.CalcMolFormula(mol)
    mw = Descriptors.MolWt(mol)
    # Try to compute IUPAC name (this may require RDKit version with IUPAC naming support)
    try:
        iupac_name = Chem.MolToIUPACName(mol)
    except Exception as e:
        iupac_name = ""
    # Generate an image of the molecule and encode it as Base64.
    img = Draw.MolToImage(mol)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    return {
        "molecular_formula": formula,
        "molecular_weight": mw,
        "iupac_name": iupac_name,
        "structure_image": img_base64
    }

def create_db():
    # Connect to MongoDB Atlas (update the connection string below)
    client = MongoClient("mongodb+srv://2002deveshsharma:BruhPass@cluster0.lkydcsf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    db = client['chemical_db']
    compounds_collection = db['compounds']
    # Clear any existing data
    compounds_collection.delete_many({})

    # Read CSV (CSV should have columns: SMILES, logP, QED, SAS)
    df = pd.read_csv("compounds.csv").head(1000)
    compounds = []
    for index, row in df.iterrows():
        smiles = row['smiles']
        props = compute_properties(smiles)
        if props is None:
            continue
        compound = {
            "smiles": smiles,
            "logP": float(row['logP']),
            "qed": float(row['qed']),
            "sas": float(row['SAS']),
        }
        compound.update(props)
        compounds.append(compound)
    if compounds:
        compounds_collection.insert_many(compounds)
    print(f"DB creation complete. Inserted {len(compounds)} compounds.")

if __name__ == "__main__":
    create_db()
