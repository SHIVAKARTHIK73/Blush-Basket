from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas
from database import get_db
from routes.auth_routes import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])


# ================= ADMIN CHECK =================
def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ================= CREATE PRODUCT (ADMIN) =================
@router.post("/", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    if product.stock < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")

    new_product = models.Product(**product.model_dump())

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


# ================= GET ALL PRODUCTS =================
@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    skip: int = 0,
    limit: int = 10
):
    query = db.query(models.Product)

    # 🔎 Filter by category
    if category:
        query = query.filter(models.Product.category == category)

    # 💰 Filter by price
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)

    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)

    products = query.offset(skip).limit(limit).all()

    return products


# ================= GET SINGLE PRODUCT =================
@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


# ================= UPDATE PRODUCT (ADMIN) =================
@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    updated_product: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = updated_product.model_dump(exclude_unset=True)

    # 🚫 Prevent negative stock
    if "stock" in update_data and update_data["stock"] < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return product


# ================= DELETE PRODUCT (ADMIN) =================
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()

    return {"message": "Product deleted successfully"}