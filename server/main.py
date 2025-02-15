# main.py
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List, Any
import os
from bson import ObjectId

app = FastAPI()

# Allow CORS from anywhere.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection details (update with your connection string or set MONGO_DETAILS in your environment)
MONGO_DETAILS = os.environ.get("MONGO_DETAILS", "mongodb+srv://2002deveshsharma:BruhPass@cluster0.lkydcsf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
client = AsyncIOMotorClient(MONGO_DETAILS)
db = client["chemical_db"]
compounds_collection = db["compounds"]
favorites_collection = db["favorites"]

# Pydantic models for validation.
class CompoundModel(BaseModel):
    id: Optional[str]
    smiles: str
    logP: float
    qed: float
    sas: float
    molecular_formula: str
    molecular_weight: float
    iupac_name: str
    structure_image: str

class FavoriteModel(BaseModel):
    user_id: str
    compound_id: str

# Helper function to convert Mongo documents.
def compound_helper(compound) -> dict:
    compound["id"] = str(compound["_id"])
    del compound["_id"]
    return compound

# Endpoint: GET /compounds  
# Supports filtering by logP, QED, SAS ranges, by solubility flag, and by SMILES substring.
@app.get("/compounds", response_model=List[Any])
async def get_compounds(
    logp_min: Optional[float] = None,
    logp_max: Optional[float] = None,
    solubility: Optional[str] = None,  # "good" or "poor"
    qed_min: Optional[float] = None,
    qed_max: Optional[float] = None,
    sas_min: Optional[float] = None,
    sas_max: Optional[float] = None,
    smile: Optional[str] = None
):
    query = {}
    # If searching by SMILES substring:
    if smile:
        query["smiles"] = {"$regex": smile, "$options": "i"}
    
    # Apply logP filter.
    if solubility:
        if solubility.lower() == "good":
            query["logP"] = {"$lte": 3.0}
        elif solubility.lower() == "poor":
            query["logP"] = {"$gt": 3.0}
    else:
        if logp_min is not None or logp_max is not None:
            query["logP"] = {}
            if logp_min is not None:
                query["logP"]["$gte"] = logp_min
            if logp_max is not None:
                query["logP"]["$lte"] = logp_max

    # QED filter.
    if qed_min is not None or qed_max is not None:
        query["qed"] = {}
        if qed_min is not None:
            query["qed"]["$gte"] = qed_min
        if qed_max is not None:
            query["qed"]["$lte"] = qed_max

    # SAS filter.
    if sas_min is not None or sas_max is not None:
        query["sas"] = {}
        if sas_min is not None:
            query["sas"]["$gte"] = sas_min
        if sas_max is not None:
            query["sas"]["$lte"] = sas_max

    compounds_cursor = compounds_collection.find(query)
    compounds = []
    async for compound in compounds_cursor:
        compounds.append(compound_helper(compound))
    return compounds

# Endpoint: GET /favorites?user_id=...  
# Returns the favorite compounds for a given user.
@app.get("/favorites", response_model=List[Any])
async def get_favorites(user_id: str = Query(...)):
    fav_cursor = favorites_collection.find({"user_id": user_id})
    favs = []
    async for fav in fav_cursor:
        favs.append(fav)
    compounds_list = []
    for fav in favs:
        compound_obj = await compounds_collection.find_one({"_id": ObjectId(fav["compound_id"])})
        if compound_obj:
            compounds_list.append(compound_helper(compound_obj))
    return compounds_list

# Endpoint: POST /favorites  
# Adds a compound to the favorites list for a given user.
@app.post("/favorites")
async def add_favorite(fav: FavoriteModel):
    # Check if this favorite already exists.
    existing = await favorites_collection.find_one({
        "user_id": fav.user_id, 
        "compound_id": fav.compound_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Favorite already exists")
    fav_dict = fav.dict()
    # Convert compound_id string to ObjectId.
    try:
        fav_dict["compound_id"] = ObjectId(fav_dict["compound_id"])
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid compound_id")
    result = await favorites_collection.insert_one(fav_dict)
    if result.inserted_id:
        return {"message": "Added to favorites"}
    else:
        raise HTTPException(status_code=500, detail="Failed to add favorite")

# Endpoint: DELETE /favorites/{favorite_id}?user_id=...
# Deletes a favorite entry for a given user.
@app.delete("/favorites/{favorite_id}")
async def delete_favorite(favorite_id: str, user_id: str = Query(...)):
    try:
        fav_obj_id = ObjectId(favorite_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid favorite_id")
    result = await favorites_collection.delete_one({"_id": fav_obj_id, "user_id": user_id})
    if result.deleted_count:
        return {"message": "Removed from favorites"}
    else:
        raise HTTPException(status_code=404, detail="Favorite not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
