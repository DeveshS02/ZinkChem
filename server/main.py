from fastapi import FastAPI, HTTPException, Depends, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from bson import ObjectId
from datetime import datetime, timedelta
import jwt as pyjwt  # Rename import to avoid confusion
from passlib.context import CryptContext
import re

# -------------------------
# Configuration & Setup
# -------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection.
client = AsyncIOMotorClient("mongodb+srv://2002deveshsharma:BruhPass@cluster0.lkydcsf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["chemical_db"]
compounds_collection = db["compounds"]
favorites_collection = db["favorites"]
users_collection = db["users"]

# Password hashing.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings.
SECRET_KEY = "your-secret-key"  # Change this in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = pyjwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)  # Use pyjwt instead of jwt
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
    )
    try:
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])  # Use pyjwt instead of jwt
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except pyjwt.PyJWTError:  # Update exception class
        raise credentials_exception
    user = await users_collection.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user

# -------------------------
# Pydantic Models
# -------------------------
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
    compound_id: str

class UserModel(BaseModel):
    username: str
    email: str
    password: str

class LoginModel(BaseModel):
    username: str
    password: str

# -------------------------
# Helper Functions
# -------------------------
def compound_helper(compound) -> dict:
    compound["id"] = str(compound["_id"])
    del compound["_id"]
    return compound

# -------------------------
# Compound Endpoints
# -------------------------
@app.get("/compounds", response_model=List[Any])
async def get_compounds(
    logp_min: Optional[float] = None,
    logp_max: Optional[float] = None,
    solubility: Optional[str] = None,  # "good" or "poor"
    qed_min: Optional[float] = None,
    qed_max: Optional[float] = None,
    druglikeness: Optional[str] = None,  # "high", "moderate", "low"
    sas_min: Optional[float] = None,
    sas_max: Optional[float] = None,
    synthesizability: Optional[str] = None,  # "easy", "moderate", "hard"
    smile: Optional[str] = None
):
    query = {}

    # SMILES search
    if smile:
        escaped_smile = re.escape(smile)
        query["smiles"] = {"$regex": escaped_smile, "$options": "i"}

    # logP / Solubility
    if solubility:
        if solubility.lower() == "good":
            query["logP"] = {"$gte": 0, "$lte": 3.0}
        elif solubility.lower() == "poor":
            query["logP"] = {"$gt": 3.0}
    else:
        if logp_min is not None or logp_max is not None:
            query["logP"] = {}
            if logp_min is not None:
                query["logP"]["$gte"] = logp_min
            if logp_max is not None:
                query["logP"]["$lte"] = logp_max

    # QED / Drug Likeness
    if druglikeness:
        if druglikeness.lower() == "high":
            query["qed"] = {"$gt": 0.67}
        elif druglikeness.lower() == "moderate":
            query["qed"] = {"$gt": 0.5, "$lte": 0.67}
        elif druglikeness.lower() == "low":
            query["qed"] = {"$lte": 0.5}
    else:
        if qed_min is not None or qed_max is not None:
            query["qed"] = {}
            if qed_min is not None:
                query["qed"]["$gte"] = qed_min
            if qed_max is not None:
                query["qed"]["$lte"] = qed_max

    # SAS / Synthesizability
    if synthesizability:
        if synthesizability.lower() == "easy":
            query["sas"] = {"$gte": 1, "$lte": 3}
        elif synthesizability.lower() == "moderate":
            query["sas"] = {"$gt": 3, "$lte": 6}
        elif synthesizability.lower() == "hard":
            query["sas"] = {"$gt": 6}
    else:
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


# -------------------------
# Favorites Endpoints (Require Auth)
# -------------------------
@app.get("/favorites", response_model=List[Any])
async def get_favorites(current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    favs = await favorites_collection.find({"user_id": username}).to_list(length=None)
    compounds_list = []
    for fav in favs:
        compound_obj = await compounds_collection.find_one({"_id": ObjectId(fav["compound_id"])})
        if compound_obj:
            compound_data = compound_helper(compound_obj)
            # Attach favorite record id to the returned compound data.
            compound_data['favorite_id'] = str(fav['_id'])
            compounds_list.append(compound_data)
    return compounds_list


@app.post("/favorites")
async def add_favorite(fav: FavoriteModel, current_user: dict = Depends(get_current_user)):
    username = current_user["username"]
    existing = await favorites_collection.find_one({
        "user_id": username, 
        "compound_id": fav.compound_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Favorite already exists")
    fav_dict = fav.dict()
    try:
        fav_dict["compound_id"] = ObjectId(fav_dict["compound_id"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid compound_id")
    fav_dict["user_id"] = username
    result = await favorites_collection.insert_one(fav_dict)
    if result.inserted_id:
        return {"message": "Added to favorites"}
    else:
        raise HTTPException(status_code=500, detail="Failed to add favorite")

@app.delete("/favorites/{favorite_id}")
async def delete_favorite(favorite_id: str, current_user: dict = Depends(get_current_user)):
    try:
        fav_obj_id = ObjectId(favorite_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid favorite_id")
    username = current_user["username"]
    result = await favorites_collection.delete_one({"_id": fav_obj_id, "user_id": username})
    if result.deleted_count:
        return {"message": "Removed from favorites"}
    else:
        raise HTTPException(status_code=404, detail="Favorite not found")

# -------------------------
# Authentication Endpoints
# -------------------------
@app.post("/register")
async def register(user: UserModel):
    existing_user = await users_collection.find_one({
        "$or": [{"username": user.username}, {"email": user.email}]
    })
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    hashed_password = pwd_context.hash(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    result = await users_collection.insert_one(user_dict)
    if result.inserted_id:
        # Optionally, automatically log in the user upon registration.
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer", "message": "User registered successfully"}
    else:
        raise HTTPException(status_code=500, detail="User registration failed")

@app.post("/login")
async def login(user: LoginModel):
    existing_user = await users_collection.find_one({"username": user.username})
    if not existing_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not pwd_context.verify(user.password, existing_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "message": "Login successful"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
