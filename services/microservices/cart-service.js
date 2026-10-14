const express = require('express');
const cors = require('cors');
const { traceMiddleware } = require('../shared/traceMiddleware');

const app = express();
const PORT = process.env.PORT || 5004;
const SERVICE_NAME = 'Cart-Service';

app.use(cors());
app.use(express.json());
app.use(traceMiddleware(SERVICE_NAME));

// Isolated Database for Cart Service
let cartsDb = {
  'user-demo': []
};

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: SERVICE_NAME, port: PORT });
});

app.get('/cart', async (req, res) => {
  const userId = 'user-demo';
  const rawItems = cartsDb[userId] || [];

  // In a microservices architecture, the Cart Service fetches latest product details
  // from the Catalog Service or receives them from the client/API Gateway
  try {
    const catalogResponse = await fetch('http://localhost:5003/products', {
      headers: {
        'x-trace-id': req.traceId,
        'x-hop-count': req.hopCount.toString()
      }
    });
    const catalogData = await catalogResponse.json();
    const products = catalogData.products || [];

    const populatedItems = rawItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        ...item,
        product: prod || { name: 'Catalog Item', price: 0, image: '' }
      };
    });

    const subtotal = populatedItems.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);

    res.json({
      success: true,
      cart: {
        userId,
        items: populatedItems,
        itemCount: rawItems.reduce((s, i) => s + i.quantity, 0),
        subtotal: parseFloat(subtotal.toFixed(2))
      },
      architectureTrace: {
        service: SERVICE_NAME,
        port: PORT,
        hopCount: req.hopCount + 1, // 1 internal hop to Catalog-Service
        traceId: req.traceId
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to communicate with Catalog Service', error: err.message });
  }
});

app.post('/cart/items', (req, res) => {
  const userId = 'user-demo';
  const { productId, quantity = 1 } = req.body;

  if (!cartsDb[userId]) {
    cartsDb[userId] = [];
  }

  const existing = cartsDb[userId].find(i => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cartsDb[userId].push({ productId, quantity });
  }

  res.json({
    success: true,
    message: 'Item added to isolated Cart microservice store',
    cart: cartsDb[userId],
    architectureTrace: {
      service: SERVICE_NAME,
      port: PORT,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

app.put('/cart/items/:productId', (req, res) => {
  const userId = 'user-demo';
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!cartsDb[userId]) cartsDb[userId] = [];

  if (quantity <= 0) {
    cartsDb[userId] = cartsDb[userId].filter(i => i.productId !== productId);
  } else {
    const item = cartsDb[userId].find(i => i.productId === productId);
    if (item) item.quantity = quantity;
  }

  res.json({
    success: true,
    cart: cartsDb[userId],
    architectureTrace: { service: SERVICE_NAME, port: PORT, traceId: req.traceId }
  });
});

app.delete('/cart/items/:productId', (req, res) => {
  const userId = 'user-demo';
  const { productId } = req.params;
  if (cartsDb[userId]) {
    cartsDb[userId] = cartsDb[userId].filter(i => i.productId !== productId);
  }
  res.json({
    success: true,
    message: 'Item deleted from Cart microservice',
    architectureTrace: { service: SERVICE_NAME, port: PORT, traceId: req.traceId }
  });
});

app.delete('/cart', (req, res) => {
  const userId = 'user-demo';
  cartsDb[userId] = [];
  res.json({ success: true, message: 'Cart database cleared for user' });
});

app.listen(PORT, () => {
  console.log(`[MICROSERVICE] ${SERVICE_NAME} running on port ${PORT}`);
});
