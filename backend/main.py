from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from database import engine, Base
import models  # Registers all database tables

# Import routers
from routes import auth_routes
from routes import product_routes
from routes import cart_routes
from routes import order_routes


# ================= CREATE APP =================
app = FastAPI(
    title="Ecommerce API",
    version="1.0.0",
    description="Simple Ecommerce Backend built with FastAPI 🚀"
)
# ================= CORS CONFIG =================
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= CREATE DATABASE TABLES =================
Base.metadata.create_all(bind=engine)


# ================= REGISTER ROUTERS =================
app.include_router(auth_routes.router)
app.include_router(product_routes.router)
app.include_router(cart_routes.router)
app.include_router(order_routes.router)


# ================= ROOT =================
@app.get("/", tags=["Root"])
def root():
    return {"message": "Ecommerce API Running 🚀"}