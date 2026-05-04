from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db
from routes.auth_routes import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])


# ================= ADD TO CART =================
@router.post("/", response_model=schemas.CartResponse)
def add_to_cart(
    cart: schemas.CartCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    product = db.query(models.Product).filter(
        models.Product.id == cart.product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_item = db.query(models.Cart).filter(
        models.Cart.product_id == cart.product_id,
        models.Cart.user_id == current_user.id
    ).first()

    # If item already exists → increase quantity
    if existing_item:
        existing_item.quantity += cart.quantity
        db.commit()
        db.refresh(existing_item)
        return existing_item

    # Create new cart item
    new_cart = models.Cart(
        product_id=cart.product_id,
        quantity=cart.quantity,
        user_id=current_user.id
    )

    db.add(new_cart)
    db.commit()
    db.refresh(new_cart)

    return new_cart


# ================= GET CART ITEMS =================
@router.get("/", response_model=List[schemas.CartResponse])
def get_cart(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Cart).filter(
        models.Cart.user_id == current_user.id
    ).all()


# ================= UPDATE CART ITEM =================
@router.put("/{cart_id}", response_model=schemas.CartResponse)
def update_cart_item(
    cart_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    item = db.query(models.Cart).filter(
        models.Cart.id == cart_id,
        models.Cart.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    # If quantity <= 0 → delete item automatically
    if quantity <= 0:
        db.delete(item)
        db.commit()
        return item

    item.quantity = quantity
    db.commit()
    db.refresh(item)

    return item


# ================= DELETE CART ITEM =================
@router.delete("/{cart_id}")
def delete_cart_item(
    cart_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    item = db.query(models.Cart).filter(
        models.Cart.id == cart_id,
        models.Cart.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()

    return {"message": "Cart item removed successfully"}