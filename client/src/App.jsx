import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  CheckCircle2,
  Lock,
  CreditCard,
  Smartphone,
  Building,
  Truck,
  Plus,
  Minus,
  Trash2,
  Search,
  Sparkles,
  Layers,
  Cpu,
  ArrowRight,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import './App.css';

const MONOLITH_URL = 'http://localhost:5001/api';
const GATEWAY_URL = 'http://localhost:5000/api';

const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
};

export default function App() {
  const [architecture, setArchitecture] = useState('microservices'); // 'monolith' | 'microservices'
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  
  // Payment Gateway states
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'cod'
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [upiId, setUpiId] = useState('alex@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvv, setCardCvv] = useState('321');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null); // order response

  const currentApiUrl = architecture === 'monolith' ? MONOLITH_URL : GATEWAY_URL;

  // Fetch products and active cart
  const fetchData = async () => {
    try {
      // 1. Fetch Products
      let prodUrl = `${currentApiUrl}/products`;
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (params.toString()) prodUrl += `?${params.toString()}`;

      const prodRes = await fetch(prodUrl);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }

      // 2. Fetch Cart
      const cartRes = await fetch(`${currentApiUrl}/cart`);
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setCart(cartData.cart || { items: [], subtotal: 0, itemCount: 0 });
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [architecture, selectedCategory, searchQuery]);

  // Add Item to Cart
  const handleAddToCart = async (productId) => {
    try {
      const res = await fetch(`${currentApiUrl}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      if (res.ok) {
        await fetchData();
        setIsCartOpen(true);
      }
    } catch (err) {
      alert('Failed to add item: ' + err.message);
    }
  };

  // Update item quantity in cart
  const handleUpdateQuantity = async (productId, currentQty, delta) => {
    const newQty = currentQty + delta;
    try {
      await fetch(`${currentApiUrl}/cart/items/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Remove item from cart
  const handleRemoveFromCart = async (productId) => {
    try {
      await fetch(`${currentApiUrl}/cart/items/${productId}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Proceed to Payment Gateway
  const handleProceedToPayment = () => {
    setIsCartOpen(false);
    setPaymentSuccess(null);
    setIsPaymentOpen(true);
  };

  // Execute payment through the active backend (Monolith or Microservices)
  const handleExecutePayment = async () => {
    setIsProcessingPayment(true);
    try {
      const res = await fetch(`${currentApiUrl}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentSuccess({
          ...data,
          paymentMethod: paymentMethod.toUpperCase(),
          paymentDetail: paymentMethod === 'upi' ? `${selectedUpiApp} (${upiId})` : paymentMethod === 'card' ? `Card ending in 8821` : selectedBank
        });
        fetchData();
      } else {
        alert(data.message || 'Payment processing failed');
      }
    } catch (err) {
      alert('Payment Error: ' + err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const categories = ['All', 'Audio', 'Wearables', 'Computing', 'Smart Home'];

  return (
    <div className="app-container">
      <div className="ambient-bg" />

      {/* Header */}
      <header className="navbar">
        <div className="brand-section" onClick={() => { setIsCartOpen(false); setIsPaymentOpen(false); }}>
          <div className="brand-logo-icon">
            <ShoppingBag size={22} />
          </div>
          <div>
            <div className="brand-title">NEXUS STORE</div>
            <div className="brand-sub">Premium Electronics & Gadgets</div>
          </div>
        </div>

        {/* Clean Architecture Switcher */}
        <div className="arch-switcher">
          <button
            className={`arch-btn ${architecture === 'monolith' ? 'active mono' : ''}`}
            onClick={() => setArchitecture('monolith')}
            id="btn-monolith"
          >
            <Layers size={14} />
            <span>Monolith</span>
            <span className="arch-port-badge">:5001</span>
          </button>
          <button
            className={`arch-btn ${architecture === 'microservices' ? 'active micro' : ''}`}
            onClick={() => setArchitecture('microservices')}
            id="btn-microservices"
          >
            <Cpu size={14} />
            <span>Microservices</span>
            <span className="arch-port-badge">:5000</span>
          </button>
        </div>

        {/* Cart Button */}
        <div className="nav-actions">
          <button className="cart-header-btn" onClick={() => setIsCartOpen(true)} id="btn-open-cart">
            <ShoppingCart size={18} />
            <span>Cart</span>
            {cart.itemCount > 0 && <span className="cart-badge">{cart.itemCount}</span>}
          </button>
        </div>
      </header>

      {/* ========================================================== */}
      {/* HOME PAGE */}
      {/* ========================================================== */}
      <main className="main-content">
        {/* Hero Section */}
        <div className="hero-banner">
          <div className="hero-pill">
            <Sparkles size={14} />
            <span>Next-Gen Audio, Computing & Wearables</span>
          </div>
          <h1 className="hero-title">Experience Technology, Redefined.</h1>
          <p className="hero-desc">
            Explore our curated catalog of audiophile headphones, titanium smartwatches, and curved displays with instant checkout and zero delivery fees across India.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="filter-bar">
          <div className="categories-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search products by name or category..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="products-grid">
          {products.map((p) => (
            <div className="product-card" key={p.id}>
              <div className="product-image-box">
                <img src={p.image} alt={p.name} className="product-image" loading="lazy" />
                <span className="card-category-badge">{p.category}</span>
                <span className="card-stock-badge">
                  {p.stock > 0 ? `${p.stock} in stock` : 'Out of Stock'}
                </span>
              </div>

              <div className="product-info">
                <div className="product-rating">
                  <span>★ {p.rating}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({p.reviewsCount} reviews)</span>
                </div>

                <h3 className="product-name">{p.name}</h3>
                <p className="product-desc">{p.description}</p>

                <div className="product-card-footer">
                  <div className="product-price">{formatINR(p.price)}</div>
                  <button
                    className="add-cart-btn"
                    onClick={() => handleAddToCart(p.id)}
                    disabled={p.stock <= 0}
                  >
                    <Plus size={16} /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ========================================================== */}
      {/* SHOPPING CART DRAWER */}
      {/* ========================================================== */}
      {isCartOpen && (
        <div className="drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title">
                <ShoppingCart size={22} />
                <span>Shopping Cart ({cart.itemCount})</span>
              </div>
              <button onClick={() => setIsCartOpen(false)} style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <div className="drawer-body">
              {cart.items.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 1rem' }}>
                  <ShoppingCart size={48} style={{ margin: '0 auto 1.25rem', opacity: 0.4 }} />
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Your cart is empty</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>Add products from the store to proceed</div>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div className="cart-item" key={item.productId}>
                    <img src={item.product?.image} alt={item.product?.name} className="cart-item-img" />
                    <div className="cart-item-details">
                      <div className="cart-item-title">{item.product?.name}</div>
                      <div className="cart-item-price">{formatINR(item.product?.price)}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <div className="quantity-controls">
                          <button
                            className="qty-btn"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity, -1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="qty-val">{item.quantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity, 1)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          style={{ color: 'var(--accent-rose)', padding: '4px' }}
                          onClick={() => handleRemoveFromCart(item.productId)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="cart-footer">
                <div className="cart-summary-line">
                  <span>Subtotal</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#fff', fontWeight: 600 }}>
                    {formatINR(cart.subtotal)}
                  </span>
                </div>
                <div className="cart-summary-line">
                  <span>Standard Delivery</span>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>FREE</span>
                </div>
                <div className="cart-total-line">
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>{formatINR(cart.subtotal)}</span>
                </div>
                <button
                  className="checkout-btn"
                  onClick={handleProceedToPayment}
                  id="btn-proceed-payment"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* PAYMENT GATEWAY MODAL */}
      {/* ========================================================== */}
      {isPaymentOpen && (
        <div className="modal-overlay" onClick={() => !isProcessingPayment && setIsPaymentOpen(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="payment-modal-header">
              <div className="gateway-brand">
                <Lock size={18} style={{ color: 'var(--accent-emerald)' }} />
                <span className="gateway-title">Nexus Payment Gateway</span>
              </div>
              <div className="gateway-secure-tag">
                <ShieldCheck size={14} />
                <span>256-Bit SSL Encrypted</span>
              </div>
            </div>

            {paymentSuccess ? (
              /* Payment Success Screen */
              <div className="success-receipt">
                <div className="receipt-icon-circle">
                  <CheckCircle2 size={36} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Payment Successful!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Your order has been placed and confirmed.
                </p>

                <div className="receipt-card">
                  <div className="receipt-row">
                    <span style={{ color: 'var(--text-secondary)' }}>Order ID:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>
                      #{paymentSuccess.order?.id}
                    </span>
                  </div>
                  <div className="receipt-row">
                    <span style={{ color: 'var(--text-secondary)' }}>Amount Paid:</span>
                    <span style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>
                      {formatINR(paymentSuccess.order?.totalAmount)}
                    </span>
                  </div>
                  <div className="receipt-row">
                    <span style={{ color: 'var(--text-secondary)' }}>Payment Method:</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{paymentSuccess.paymentDetail}</span>
                  </div>
                  <div className="receipt-row">
                    <span style={{ color: 'var(--text-secondary)' }}>Backend Architecture:</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      {architecture === 'monolith' ? 'Monolith (ACID Transaction)' : 'Microservices (Saga Orchestration)'}
                    </span>
                  </div>
                </div>

                <button
                  className="pay-action-btn"
                  onClick={() => setIsPaymentOpen(false)}
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              /* Payment Form */
              <div>
                {/* Total amount banner */}
                <div className="payment-amount-banner">
                  <span className="amount-label">Amount Payable:</span>
                  <span className="amount-value">{formatINR(cart.subtotal)}</span>
                </div>

                {/* Method selector tabs */}
                <div className="payment-methods-tabs">
                  <button
                    className={`method-tab ${paymentMethod === 'upi' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <Smartphone size={16} />
                    <span>UPI</span>
                  </button>
                  <button
                    className={`method-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard size={16} />
                    <span>Cards</span>
                  </button>
                  <button
                    className={`method-tab ${paymentMethod === 'netbanking' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('netbanking')}
                  >
                    <Building size={16} />
                    <span>Net Banking</span>
                  </button>
                  <button
                    className={`method-tab ${paymentMethod === 'cod' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <Truck size={16} />
                    <span>COD</span>
                  </button>
                </div>

                <div className="payment-form-body">
                  {/* UPI Tab */}
                  {paymentMethod === 'upi' && (
                    <div>
                      <label className="form-label">Select UPI App:</label>
                      <div className="upi-apps-row">
                        {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                          <button
                            key={app}
                            className={`upi-app-btn ${selectedUpiApp === app ? 'selected' : ''}`}
                            onClick={() => setSelectedUpiApp(app)}
                          >
                            {app}
                          </button>
                        ))}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Or enter UPI ID / VPA:</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. mobile@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Card Tab */}
                  {paymentMethod === 'card' && (
                    <div>
                      <div className="form-group">
                        <label className="form-label">Card Number:</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="4532 •••• •••• ••••"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Expiry (MM/YY):</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">CVV:</label>
                          <input
                            type="password"
                            maxLength="3"
                            className="form-input"
                            placeholder="•••"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Net Banking Tab */}
                  {paymentMethod === 'netbanking' && (
                    <div className="form-group">
                      <label className="form-label">Select Bank:</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((bank) => (
                          <button
                            key={bank}
                            className={`upi-app-btn ${selectedBank === bank ? 'selected' : ''}`}
                            onClick={() => setSelectedBank(bank)}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* COD Tab */}
                  {paymentMethod === 'cod' && (
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      Pay with Cash or UPI QR Code at the time of delivery. Free shipping applicable.
                    </div>
                  )}

                  {/* Pay Action Button */}
                  <button
                    className="pay-action-btn"
                    onClick={handleExecutePayment}
                    disabled={isProcessingPayment}
                    id="btn-pay-now"
                  >
                    {isProcessingPayment ? (
                      <span>Verifying & Processing Payment...</span>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>Pay {formatINR(cart.subtotal)}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
