from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db
from routes.auth_routes import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


# ================= ADMIN CHECK =================
def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ================= PLACE ORDER =================
@router.post("/", response_model=schemas.OrderResponse)
def place_order(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cart_items = db.query(models.Cart).filter(
        models.Cart.user_id == current_user.id
    ).all()

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total_amount = 0

    # 🔥 CHECK STOCK + CALCULATE TOTAL
    for item in cart_items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).first()

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough stock for {product.name}"
            )

        total_amount += product.price * item.quantity

    # ✅ CREATE ORDER
    new_order = models.Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status="Pending"
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # ✅ CREATE ORDER ITEMS + DEDUCT STOCK
    for item in cart_items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).first()

        order_item = models.OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            quantity=item.quantity,
            price=product.price
        )

        # 🔥 Deduct stock
        product.stock -= item.quantity

        db.add(order_item)

    # ✅ CLEAR CART
    for item in cart_items:
        db.delete(item)

    db.commit()
    db.refresh(new_order)

    return new_order


# ================= GET ORDERS =================
@router.get("/", response_model=List[schemas.OrderResponse])
def get_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(models.Order).all()

    return db.query(models.Order).filter(
        models.Order.user_id == current_user.id
    ).all()


# ================= GET SINGLE ORDER =================
@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_single_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    order = db.query(models.Order).filter(
        models.Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role != "admin" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return order


# ================= UPDATE ORDER STATUS (ADMIN) =================
@router.put("/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    order = db.query(models.Order).filter(
        models.Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    valid_status = ["Pending", "Confirmed", "Cancelled"]

    if status_update.status not in valid_status:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of {valid_status}"
        )

    order.status = status_update.status

    db.commit()
    db.refresh(order)

    return order