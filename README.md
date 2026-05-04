# 🌸 BlushBasket — Enhanced Beauty E-Commerce

Pastel-pink Nykaa-inspired beauty store with glassmorphism, 3D card effects, animations & full React + FastAPI stack.

---

## 🚀 HOW TO RUN

### 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
Backend runs at → http://127.0.0.1:8000
API Docs        → http://127.0.0.1:8000/docs

### 2. Frontend (React)

```bash
cd frontend
npm install
npm start
```
App opens at → http://localhost:3000

---

## 👤 ACCOUNTS

- **First registered user = ADMIN** (can add/edit/delete products & manage orders)
- All other users = Regular shoppers

---

## ✨ FEATURES 

- Glassmorphism navbar with cart badge
- Animated hero section with live stats
- 3D product cards with hover lift effect
- Category filter pills
- Search + price range filter
- Wishlist (heart button)
- Floating particle background
- Toast notifications (no more alert() popups)
- Cart with quantity controls
- Order placement & status tracking
- Admin: product CRUD, order approval
- Responsive mobile layout

---

## 🎨 COLOR PALETTE

| Name          | Hex       |
|---------------|-----------|
| Pink Deep     | #FFD7E1   |
| Pink Mid      | #FEE0E7   |
| Pink Soft     | #FCE8ED   |
| Pink Pale     | #FBF1F3   |
| Pink Whisper  | #F9F9F9   |
| Accent Rose   | #E8758A   |
| Accent Deep   | #C4506A   |

---

## 🗂️ PROJECT STRUCTURE

```
BlushBasket_Enhanced/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── routes/
│       ├── auth_routes.py
│       ├── product_routes.py
│       ├── cart_routes.py
│       └── order_routes.py
└── frontend/
    ├── package.json
    └── src/
        ├── App.js        ← Main component (enhanced)
        ├── App.css       ← Full Nykaa-style theme
        ├── Login.js      ← Glassmorphism login
        ├── Register.js   ← Animated register
        ├── index.js
        └── index.css
```
