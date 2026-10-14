const express = require('express');
const cors = require('cors');
const { initialProducts, initialUsers } = require('../shared/initialData');
const { traceMiddleware } = require('../shared/traceMiddleware');

const app = express();
const PORT = process.env.PORT || 5001;
const SERVICE_NAME = 'Monolith-Core';

app.use(cors());
app.use(express.json());
app.use(traceMiddleware(SERVICE_NAME));

// --- Monolithic Unified Database (Single Shared Store) ---
let db = {
  users: JSON.parse(JSON.stringify(initialUsers)),
  products: JSON.parse(JSON.stringify(initialProducts)),
  carts: {
    'user-demo': []
  },
  orders: [],
  metrics: {
    totalRequests: 0,
    ordersProcessed: 0
  }
};

app.use((req, res, next) => {
  db.metrics.totalRequests++;
  next();
});

// ==========================================
// 1. Topology & System Telemetry Endpoint
// ==========================================
app.get('/api/topology', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    architecture: 'Monolithic',
    mode: 'monolith',
    port: PORT,
    service: SERVICE_NAME,
    characteristics: {
      deployment: 'Single unified deployment unit',
      database: 'Shared single database (unified memory)',
      communication: 'In-memory / internal method invocation',
      latencyProfile: 'Lowest network overhead (0 network hops between modules)',
      failureBlastRadius: 'High (a crash in any module affects the entire system)'
    },
    modules: ['Auth', 'Product Catalog', 'Cart', 'Order Management', 'Inventory', 'Billing'],
    telemetry: {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryHeapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
      memoryRssMB: (mem.rss / 1024 / 1024).toFixed(2),
      totalRequests: db.metrics.totalRequests,
      ordersCount: db.orders.length,
      hopCount: 1
    }
  });
});

// ==========================================
// 2. Auth Module
// ==========================================
app.get('/api/auth/me', (req, res) => {
  const user = db.users[0];
  res.json({
    success: true,
    user,
    architectureTrace: {
      service: SERVICE_NAME,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

// ==========================================
// 3. Product Catalog Module
// ==========================================
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let results = [...db.products];

  if (category && category !== 'All') {
    results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  res.json({
    success: true,
    total: results.length,
    products: results,
    architectureTrace: {
      service: SERVICE_NAME,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({
    success: true,
    product,
    architectureTrace: {
      service: SERVICE_NAME,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

// ==========================================
// 4. Cart Module
// ==========================================
app.get('/api/cart', (req, res) => {
  const userId = 'user-demo';
  const cartItems = db.carts[userId] || [];
  
  // Calculate subtotal in-memory
  const populatedItems = cartItems.map(item => {
    const prod = db.products.find(p => p.id === item.productId);
    return {
      ...item,
      product: prod || { name: 'Unknown Product', price: 0 }
    };
  });

  const subtotal = populatedItems.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);

  res.json({
    success: true,
    cart: {
      userId,
      items: populatedItems,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: parseFloat(subtotal.toFixed(2))
    },
    architectureTrace: {
      service: SERVICE_NAME,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

app.post('/api/cart/items', (req, res) => {
  const userId = 'user-demo';
  const { productId, quantity = 1 } = req.body;

  const product = db.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  if (product.stock < quantity) {
    return res.status(400).json({ success: false, message: 'Insufficient stock in warehouse' });
  }

  if (!db.carts[userId]) {
    db.carts[userId] = [];
  }

  const existingIndex = db.carts[userId].findIndex(item => item.productId === productId);
  if (existingIndex > -1) {
    db.carts[userId][existingIndex].quantity += quantity;
  } else {
    db.carts[userId].push({ productId, quantity });
  }

  res.json({
    success: true,
    message: 'Item added to cart (Monolith direct memory update)',
    cart: db.carts[userId],
    architectureTrace: {
      service: SERVICE_NAME,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

app.put('/api/cart/items/:productId', (req, res) => {
  const userId = 'user-demo';
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!db.carts[userId]) {
    return res.status(404).json({ success: false, message: 'Cart not found' });
  }

  if (quantity <= 0) {
    db.carts[userId] = db.carts[userId].filter(item => item.productId !== productId);
  } else {
    const item = db.carts[userId].find(i => i.productId === productId);
    if (item) {
      item.quantity = quantity;
    }
  }

  res.json({
    success: true,
    message: 'Cart updated',
    cart: db.carts[userId],
    architectureTrace: {
      service: SERVICE_NAME,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

app.delete('/api/cart/items/:productId', (req, res) => {
  const userId = 'user-demo';
  const { productId } = req.params;

  if (db.carts[userId]) {
    db.carts[userId] = db.carts[userId].filter(item => item.productId !== productId);
  }

  res.json({
    success: true,
    message: 'Item removed from cart',
    architectureTrace: {
      service: SERVICE_NAME,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

app.delete('/api/cart', (req, res) => {
  const userId = 'user-demo';
  db.carts[userId] = [];
  res.json({ success: true, message: 'Cart cleared' });
});

// ==========================================
// 5. Order & Checkout Module (Monolithic ACID Transaction)
// ==========================================
app.post('/api/orders/checkout', (req, res) => {
  const userId = 'user-demo';
  const cartItems = db.carts[userId] || [];

  if (cartItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  // Synchronous Monolithic Transaction (All in one process & memory context):
  // Step 1: Validate stock
  for (const item of cartItems) {
    const prod = db.products.find(p => p.id === item.productId);
    if (!prod || prod.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for product: ${prod ? prod.name : item.productId}`
      });
    }
  }

  // Step 2: Calculate total and prepare order snapshot
  let orderTotal = 0;
  const orderItems = [];

  for (const item of cartItems) {
    const prod = db.products.find(p => p.id === item.productId);
    prod.stock -= item.quantity; // Direct mutation in shared database
    orderTotal += prod.price * item.quantity;
    orderItems.push({
      productId: prod.id,
      name: prod.name,
      price: prod.price,
      quantity: item.quantity,
      image: prod.image
    });
  }

  // Step 3: Create Order record
  const newOrder = {
    id: `ord-mono-${Date.now().toString(36).toUpperCase()}`,
    userId,
    items: orderItems,
    totalAmount: parseFloat(orderTotal.toFixed(2)),
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
    executionType: 'Monolithic Single Transaction (In-Process)',
    hops: 1,
    traces: [
      { step: 'Validate Inventory', latencyMs: 0.2, service: SERVICE_NAME },
      { step: 'Deduct Stock', latencyMs: 0.1, service: SERVICE_NAME },
      { step: 'Process Simulated Payment', latencyMs: 5.0, service: SERVICE_NAME },
      { step: 'Persist Order Entity', latencyMs: 0.3, service: SERVICE_NAME }
    ]
  };

  db.orders.unshift(newOrder);
  db.metrics.ordersProcessed++;
  db.carts[userId] = []; // Clear cart

  res.json({
    success: true,
    message: 'Order placed successfully via monolithic transactional flow',
    order: newOrder,
    architectureTrace: {
      service: SERVICE_NAME,
      hopCount: req.hopCount,
      traceId: req.traceId,
      architecture: 'Monolithic'
    }
  });
});

app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    orders: db.orders,
    architectureTrace: {
      service: SERVICE_NAME,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

// ==========================================
// 6. Reset State Endpoint (For Live Demos)
// ==========================================
app.post('/api/admin/reset', (req, res) => {
  db = {
    users: JSON.parse(JSON.stringify(initialUsers)),
    products: JSON.parse(JSON.stringify(initialProducts)),
    carts: { 'user-demo': [] },
    orders: [],
    metrics: { totalRequests: 0, ordersProcessed: 0 }
  };
  res.json({ success: true, message: 'Monolith store reset to initial state' });
});

app.listen(PORT, () => {
  console.log(`[MONOLITH] Monolithic Ecommerce Application running at http://localhost:${PORT}`);
});
