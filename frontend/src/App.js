import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Login from "./Login";
import Register from "./Register";
import "./App.css";

// ─── category emoji map ───────────────────────────────────────────────────────
const CAT_EMOJI = { Lipstick:"💄", Skincare:"🧴", Foundation:"✨", Mascara:"👁️", Blush:"🌸", Serum:"💎", Moisturizer:"🧖", Perfume:"🌺", Eyeshadow:"🎨", default:"🌸" };
const getCatEmoji = (cat) => CAT_EMOJI[cat] || CAT_EMOJI.default;

// ─── Toast component ──────────────────────────────────────────────────────────
function Toast({ msg, icon, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="toast">
      <span className="toast-icon">{icon}</span>
      <span className="toast-msg">{msg}</span>
    </div>
  );
}

// ─── Floating particles ───────────────────────────────────────────────────────
function Particles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 20 + 8,
    left: Math.random() * 100,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.4 + 0.1,
  }));
  return (
    <div className="particles">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          width: p.size, height: p.size,
          left: `${p.left}%`, bottom: "-30px",
          opacity: p.opacity,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState("All");
  const [toast, setToast] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const itemsPerPage = 8;

  const [newProduct, setNewProduct] = useState({ name:"", description:"", price:"", image_url:"", category:"", stock:"" });

  const showToast = useCallback((msg, icon = "✨") => {
    setToast({ msg, icon });
  }, []);

  // ── fetch user ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      const t = localStorage.getItem("token");
      if (!t) return;
      try {
        const res = await axios.get("http://127.0.0.1:8000/auth/me", { headers: { Authorization: `Bearer ${t}` } });
        setUser(res.data);
      } catch {}
    };
    fetchUser();
  }, [token]);

  // ── fetch products ──────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/products/?limit=100");
      setProducts(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── fetch cart ──────────────────────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) return;
    try {
      const res = await axios.get("http://127.0.0.1:8000/cart/", { headers: { Authorization: `Bearer ${t}` } });
      setCartItems(res.data);
      setShowCart(true); setShowOrders(false); setSelectedProduct(null);
    } catch {}
  }, []);

  // ── fetch orders ─────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) return;
    try {
      const res = await axios.get("http://127.0.0.1:8000/orders/", { headers: { Authorization: `Bearer ${t}` } });
      setOrders(res.data);
      setShowOrders(true); setShowCart(false); setSelectedProduct(null);
    } catch {}
  }, []);

  // ── add to cart ─────────────────────────────────────────────────────────────
  const addToCart = async (productId) => {
    const t = localStorage.getItem("token");
    if (!t) return;
    try {
      await axios.post("http://127.0.0.1:8000/cart/", { product_id: productId, quantity }, { headers: { Authorization: `Bearer ${t}` } });
      showToast("Added to cart!", "🛒");
      setQuantity(1);
    } catch {}
  };

  // ── update cart ─────────────────────────────────────────────────────────────
  const updateCart = async (itemId, newQty) => {
    const t = localStorage.getItem("token");
    if (!t) return;
    setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQty > 0 ? newQty : 0 } : item));
    try {
      if (newQty <= 0) {
        await axios.delete(`http://127.0.0.1:8000/cart/${itemId}`, { headers: { Authorization: `Bearer ${t}` } });
        setCartItems(prev => prev.filter(i => i.id !== itemId));
      } else {
        await axios.put(`http://127.0.0.1:8000/cart/${itemId}`, { quantity: newQty }, { headers: { Authorization: `Bearer ${t}` } });
      }
    } catch {}
  };

  // ── place order ─────────────────────────────────────────────────────────────
  const placeOrder = async () => {
    const t = localStorage.getItem("token");
    if (!t) return;
    try {
      await axios.post("http://127.0.0.1:8000/orders/", {}, { headers: { Authorization: `Bearer ${t}` } });
      showToast("Order placed successfully! 🎉", "🎊");
      fetchCart(); setShowCart(false);
    } catch (e) {
      showToast(e.response?.data?.detail || "Order failed", "❌");
    }
  };

  // ── update order status ─────────────────────────────────────────────────────
  const updateOrderStatus = async (orderId, status) => {
    const t = localStorage.getItem("token");
    if (!t) return;
    try {
      await axios.put(`http://127.0.0.1:8000/orders/${orderId}/status`, { status }, { headers: { Authorization: `Bearer ${t}` } });
      fetchOrders();
      showToast(`Order ${status}`, status === "Confirmed" ? "✅" : "❌");
    } catch {}
  };

  // ── add product ─────────────────────────────────────────────────────────────
  const addProduct = async () => {
    const t = localStorage.getItem("token");
    if (!t) return;
    try {
      await axios.post("http://127.0.0.1:8000/products/", newProduct, { headers: { Authorization: `Bearer ${t}` } });
      showToast("Product added!", "✅");
      setShowAddProduct(false);
      setNewProduct({ name:"", description:"", price:"", image_url:"", category:"", stock:"" });
      fetchProducts();
    } catch {}
  };

  // ── delete product ──────────────────────────────────────────────────────────
  const deleteProduct = async (productId) => {
    const t = localStorage.getItem("token");
    if (!t) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/products/${productId}`, { headers: { Authorization: `Bearer ${t}` } });
      fetchProducts();
      showToast("Product deleted", "🗑️");
    } catch {}
  };

  // ── update product ──────────────────────────────────────────────────────────
  const updateProduct = async () => {
    const t = localStorage.getItem("token");
    if (!t || !selectedProduct) return;
    try {
      await axios.put(`http://127.0.0.1:8000/products/${selectedProduct.id}`, selectedProduct, { headers: { Authorization: `Bearer ${t}` } });
      setIsEditing(false);
      fetchProducts();
      showToast("Product updated!", "✅");
    } catch {}
  };

  // ── toggle wishlist ─────────────────────────────────────────────────────────
  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ── auth guard ──────────────────────────────────────────────────────────────
  if (!token) {
    return showRegister
      ? <Register goToLogin={() => setShowRegister(false)} />
      : <Login setToken={setToken} goToRegister={() => setShowRegister(true)} />;
  }

  // ── computed ────────────────────────────────────────────────────────────────
  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
  const calculateTotal = () => cartItems.reduce((total, item) => {
    const p = products.find(p => p.id === item.product_id);
    return total + (p?.price || 0) * item.quantity;
  }, 0);

  const filteredProducts = products
    .filter(p => activeCategory === "All" || p.category === activeCategory)
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => (minPrice === "" || p.price >= parseFloat(minPrice)) && (maxPrice === "" || p.price <= parseFloat(maxPrice)));

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="app-bg">
      <Particles />

      {/* ── TOAST ── */}
      {toast && <Toast msg={toast.msg} icon={toast.icon} onClose={() => setToast(null)} />}

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => { setShowCart(false); setShowOrders(false); setSelectedProduct(null); setShowAddProduct(false); }}>
          <div className="navbar-logo">🌸</div>
          <div>
            <div className="navbar-title">BlushBasket</div>
            <div className="navbar-sub">Beauty & Skincare</div>
          </div>
        </div>
        <div className="navbar-actions">
          {user?.role === "admin" && (
            <button className="nav-btn nav-btn-ghost" onClick={() => { setShowAddProduct(true); setShowCart(false); setShowOrders(false); setSelectedProduct(null); }}>
              👑 Add Product
            </button>
          )}
          <button className="nav-btn nav-btn-ghost" onClick={fetchOrders}>📦 Orders</button>
          <button className="nav-btn nav-btn-primary" onClick={fetchCart} style={{ position:"relative" }}>
            🛒 Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <button className="nav-btn nav-btn-danger" onClick={() => { localStorage.removeItem("token"); setToken(""); setUser(null); }}>
            Logout
          </button>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────── CART VIEW ── */}
      {showCart && (
        <div className="cart-page">
          <button className="btn-back" onClick={() => setShowCart(false)}>← Back to Products</button>
          <h1 className="page-title">Your Cart 🛒</h1>

          {cartItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <div className="empty-title">Your cart is empty</div>
              <div className="empty-sub">Discover beautiful products and add them here</div>
            </div>
          ) : (
            <>
              {cartItems.map(item => {
                const product = products.find(p => p.id === item.product_id);
                return (
                  <div key={item.id} className="cart-item">
                    {product?.image_url
                      ? <img className="cart-img" src={product.image_url} alt={product?.name} onError={e => { e.target.style.display="none"; }} />
                      : <div className="cart-img-placeholder">{getCatEmoji(product?.category)}</div>
                    }
                    <div className="cart-item-info">
                      <div className="cart-item-name">{product?.name}</div>
                      <div className="cart-item-price">₹ {product?.price}</div>
                      <div className="cart-qty-row">
                        <button className="cart-qty-btn" onClick={() => updateCart(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                        <span className="cart-qty-num">{item.quantity}</span>
                        <button className="cart-qty-btn" onClick={() => updateCart(item.id, item.quantity + 1)}>+</button>
                        <button className="btn-remove" onClick={() => updateCart(item.id, 0)}>Remove</button>
                      </div>
                    </div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"22px", fontWeight:600, color:"#C4506A", alignSelf:"center" }}>
                      ₹ {((product?.price || 0) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                );
              })}

              <div className="cart-summary">
                <div className="cart-total">
                  <span className="cart-total-label">Total Amount</span>
                  <span className="cart-total-amount">₹ {calculateTotal().toFixed(2)}</span>
                </div>
                <button className="btn-place-order" onClick={placeOrder}>Place Order ✨</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────── ORDERS VIEW ── */}
      {showOrders && (
        <div className="orders-page">
          <button className="btn-back" onClick={() => setShowOrders(false)}>← Back to Products</button>
          <h1 className="page-title">
            {user?.role === "admin" ? "All Orders 📦" : "My Orders 📦"}
          </h1>

          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <div className="empty-title">No orders yet</div>
              <div className="empty-sub">Your orders will appear here once you place them</div>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">Order #{order.id}</span>
                  <span className={`order-status status-${order.status.toLowerCase()}`}>{order.status}</span>
                </div>
                {order.items?.map(item => {
                  const product = products.find(p => p.id === item.product_id);
                  return (
                    <div key={item.id} className="order-item">
                      {product?.image_url
                        ? <img src={product.image_url} alt={product?.name} onError={e => { e.target.style.display="none"; }} />
                        : <div className="order-item-img-ph">{getCatEmoji(product?.category)}</div>
                      }
                      <div>
                        <div className="order-item-name">{product?.name || "Product"}</div>
                        <div className="order-item-qty">Qty: {item.quantity}</div>
                      </div>
                      <div className="order-item-price">₹ {item.price * item.quantity}</div>
                    </div>
                  );
                })}
                <div className="order-total-row">
                  <span style={{ fontSize:"13px", color:"#B08090", textTransform:"uppercase", letterSpacing:"1px" }}>Total</span>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"24px", fontWeight:600, color:"#C4506A" }}>₹ {order.total_amount}</span>
                </div>
                {user?.role === "admin" && order.status === "Pending" && (
                  <div className="order-admin-btns">
                    <button className="btn-approve" onClick={() => updateOrderStatus(order.id, "Confirmed")}>✅ Confirm</button>
                    <button className="btn-cancel-order" onClick={() => updateOrderStatus(order.id, "Cancelled")}>Cancel</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────── ADD PRODUCT VIEW ── */}
      {showAddProduct && user?.role === "admin" && (
        <div className="add-product-page">
          <button className="btn-back" onClick={() => setShowAddProduct(false)}>← Back to Products</button>
          <h1 className="page-title">Add Product 👑</h1>
          <div className="add-product-card">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input className="form-input" placeholder="e.g. Rose Glow Serum" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" placeholder="e.g. Skincare" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input className="form-input" type="number" placeholder="499" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Stock</label>
                <input className="form-input" type="number" placeholder="50" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock:e.target.value})} />
              </div>
              <div className="form-group full">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Describe the product..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description:e.target.value})} />
              </div>
              <div className="form-group full">
                <label className="form-label">Image URL</label>
                <input className="form-input" placeholder="https://..." value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url:e.target.value})} />
              </div>
            </div>
            <button className="btn-save" onClick={addProduct}>Save Product ✨</button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────── PRODUCT DETAIL VIEW ── */}
      {selectedProduct && !showCart && !showOrders && !showAddProduct && (
        <div style={{ position:"relative", zIndex:1 }}>
          <div className="product-detail">
            <div>
              <button className="btn-back" onClick={() => { setSelectedProduct(null); setQuantity(1); setIsEditing(false); }}>← Back to Products</button>
              <div className="product-detail-img-wrap">
                {selectedProduct.image_url
                  ? <img src={selectedProduct.image_url} alt={selectedProduct.name} onError={e => { e.target.style.display="none"; }} />
                  : <div className="product-detail-img-placeholder">{getCatEmoji(selectedProduct.category)}</div>
                }
              </div>
            </div>
            <div className="product-detail-info">
              {isEditing && user?.role === "admin" ? (
                <>
                  <div className="detail-category">Editing Product</div>
                  <div className="edit-form">
                    <input className="edit-input" placeholder="Name" value={selectedProduct.name} onChange={e => setSelectedProduct({...selectedProduct, name:e.target.value})} />
                    <input className="edit-input" placeholder="Description" value={selectedProduct.description} onChange={e => setSelectedProduct({...selectedProduct, description:e.target.value})} />
                    <input className="edit-input" type="number" placeholder="Price" value={selectedProduct.price} onChange={e => setSelectedProduct({...selectedProduct, price:e.target.value})} />
                    <input className="edit-input" placeholder="Image URL" value={selectedProduct.image_url || ""} onChange={e => setSelectedProduct({...selectedProduct, image_url:e.target.value})} />
                    <input className="edit-input" placeholder="Category" value={selectedProduct.category || ""} onChange={e => setSelectedProduct({...selectedProduct, category:e.target.value})} />
                    <input className="edit-input" type="number" placeholder="Stock" value={selectedProduct.stock} onChange={e => setSelectedProduct({...selectedProduct, stock:e.target.value})} />
                  </div>
                  <button className="btn-update" onClick={updateProduct}>Update Product ✅</button>
                  <button className="btn-back" style={{ marginTop:"10px" }} onClick={() => setIsEditing(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="detail-category">{selectedProduct.category || "Beauty"}</div>
                  <div className="detail-name">{selectedProduct.name}</div>
                  <div className="detail-desc">{selectedProduct.description}</div>
                  <div className="detail-price">₹ {selectedProduct.price}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"20px" }}>
                    <span style={{ fontSize:"12px", color:"#66C87A", background:"#F0FBF2", padding:"4px 10px", borderRadius:"20px", fontWeight:500 }}>
                      {selectedProduct.stock > 0 ? `✓ In Stock (${selectedProduct.stock})` : "Out of Stock"}
                    </span>
                  </div>
                  <div className="qty-control">
                    <span className="qty-label">Qty</span>
                    <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>−</button>
                    <span className="qty-num">{quantity}</span>
                    <button className="qty-btn" onClick={() => setQuantity(q => q + 1)}>+</button>
                  </div>
                  <button className="btn-detail-cart" onClick={() => addToCart(selectedProduct.id)}>
                    🛒 Add to Cart — ₹ {(selectedProduct.price * quantity).toFixed(2)}
                  </button>
                  {user?.role === "admin" && (
                    <button className="btn-back" style={{ marginTop:"12px" }} onClick={() => setIsEditing(true)}>✏️ Edit Product</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────── PRODUCT LIST ── */}
      {!showCart && !showOrders && !selectedProduct && !showAddProduct && (
        <div style={{ position:"relative", zIndex:1 }}>
          {/* Hero */}
          <div className="hero">
            <div className="hero-badge">✨ New Arrivals Every Week</div>
            <h1 className="hero-title">
              Discover Your<br /><em>Beauty Ritual</em>
            </h1>
            <p className="hero-sub">Curated skincare & makeup products that transform your daily routine into a luxurious self-care experience.</p>
            <button className="hero-cta" onClick={() => document.querySelector('.product-grid')?.scrollIntoView({ behavior:'smooth' })}>
              Shop Now ↓
            </button>
            <div className="hero-stats">
              <div><div className="hero-stat-num">{products.length}+</div><div className="hero-stat-label">Products</div></div>
              <div><div className="hero-stat-num">100%</div><div className="hero-stat-label">Authentic</div></div>
              <div><div className="hero-stat-num">Free</div><div className="hero-stat-label">Returns</div></div>
            </div>
          </div>

          {/* Admin Stats */}
          {user?.role === "admin" && (
            <div className="admin-stats">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div><div className="stat-num">{products.length}</div><div className="stat-lbl">Products</div></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🛒</div>
                <div><div className="stat-num">{cartItems.reduce((s,i) => s+i.quantity, 0)}</div><div className="stat-lbl">Cart Items</div></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎀</div>
                <div><div className="stat-num">{orders.length}</div><div className="stat-lbl">Orders</div></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div><div className="stat-num">{wishlist.length}</div><div className="stat-lbl">Wishlisted</div></div>
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="categories">
            {categories.map(cat => (
              <button key={cat} className={`cat-pill ${activeCategory === cat ? "active" : ""}`}
                onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}>
                {cat !== "All" ? getCatEmoji(cat) + " " : "🌸 "}{cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="search-bar-wrap">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search products..." value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
            </div>
            <input className="price-input" type="number" placeholder="Min ₹" value={minPrice}
              onChange={e => { setMinPrice(e.target.value); setCurrentPage(1); }} />
            <input className="price-input" type="number" placeholder="Max ₹" value={maxPrice}
              onChange={e => { setMaxPrice(e.target.value); setCurrentPage(1); }} />
          </div>

          {/* Section header */}
          <div className="section-header">
            <h2 className="section-title">
              {activeCategory === "All" ? <>Our <span>Collection</span></> : <>{getCatEmoji(activeCategory)} <span>{activeCategory}</span></>}
            </h2>
            <span className="section-count">{filteredProducts.length} products</span>
          </div>

          {/* Product Grid */}
          {displayedProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">No products found</div>
              <div className="empty-sub">Try adjusting your search or filters</div>
            </div>
          ) : (
            <div className="product-grid">
              {displayedProducts.map((product, idx) => (
                <div key={product.id} className="product-card"
                  style={{ animationDelay:`${idx * 0.06}s`, animation:`fadeInUp 0.5s ease ${idx * 0.06}s both` }}>
                  <div className="product-img-wrap" onClick={() => setSelectedProduct(product)}>
                    {product.image_url
                      ? <img src={product.image_url} alt={product.name} onError={e => { e.target.style.display="none"; e.target.nextSibling?.style && (e.target.nextSibling.style.display = "flex"); }} />
                      : null
                    }
                    <div className="product-img-placeholder" style={{ display: product.image_url ? "none" : "flex" }}>{getCatEmoji(product.category)}</div>
                    {product.stock < 10 && product.stock > 0 && <span className="product-badge">Low Stock</span>}
                    {product.stock === 0 && <span className="product-badge" style={{ background:"#999" }}>Sold Out</span>}
                    <button className="product-wishlist" onClick={e => { e.stopPropagation(); toggleWishlist(product.id); }}>
                      {wishlist.includes(product.id) ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <div className="product-info" onClick={() => setSelectedProduct(product)}>
                    <div className="product-category">{product.category || "Beauty"}</div>
                    <div className="product-name">{product.name}</div>
                    <div className="product-price-row">
                      <span className="product-price">₹ {product.price}</span>
                      <span className={`product-stock ${product.stock < 10 ? "low" : ""}`}>
                        {product.stock > 0 ? `${product.stock} left` : "Out"}
                      </span>
                    </div>
                  </div>
                  <div className="product-card-actions">
                    <button className="btn-add-cart" onClick={() => { setSelectedProduct(product); setQuantity(1); }}>
                      🛒 Add to Cart
                    </button>
                    {user?.role === "admin" && (
                      <>
                        <button className="btn-admin" onClick={e => { e.stopPropagation(); setSelectedProduct(product); setIsEditing(true); }}>✏️</button>
                        <button className="btn-admin danger" onClick={e => { e.stopPropagation(); deleteProduct(product.id); }}>🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              {currentPage > 1 && <button className="page-btn" onClick={() => setCurrentPage(p => p - 1)}>←</button>}
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} className={`page-btn ${currentPage === i + 1 ? "active" : ""}`} onClick={() => setCurrentPage(i + 1)}>
                  {i + 1}
                </button>
              ))}
              {currentPage < totalPages && <button className="page-btn" onClick={() => setCurrentPage(p => p + 1)}>→</button>}
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <div className="footer-brand">🌸 BlushBasket</div>
            <div className="footer-text">© 2025 BlushBasket · Crafted with love for beauty lovers</div>
          </div>
        </div>
      )}
    </div>
  );
}
