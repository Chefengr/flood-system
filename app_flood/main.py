from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from geopy.distance import great_circle
from sqlalchemy import create_engine, Column, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Setup
DATABASE_URL = os.getenv("DB_URL", "mysql+pymysql://user:password@localhost/flood_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Model
class FloodSensor(Base):
    __tablename__ = "flood_sensors"
    
    id = Column(String(50), primary_key=True)
    latitude = Column(Float)
    longitude = Column(Float)
    water_level = Column(Float)  # in cm
    timestamp = Column(DateTime)

# API Endpoint
@app.get("/api/nearby-floods")
async def get_nearby_floods(lat: float, lng: float, radius: int = 1000):
    db = SessionLocal()
    try:
        # Get all sensors (in production, use spatial queries)
        sensors = db.query(FloodSensor).all()
        
        nearby_floods = []
        for sensor in sensors:
            distance = great_circle(
                (lat, lng), 
                (sensor.latitude, sensor.longitude)
            ).meters
            
            if distance <= radius:
                nearby_floods.append({
                    "id": sensor.id,
                    "latitude": sensor.latitude,
                    "longitude": sensor.longitude,
                    "water_level": sensor.water_level,
                    "distance": round(distance),
                    "timestamp": sensor.timestamp.isoformat()
                })
        
        return {"data": nearby_floods}
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)