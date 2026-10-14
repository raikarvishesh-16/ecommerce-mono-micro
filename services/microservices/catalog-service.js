const express = require('express');
const cors = require('cors');
const { initialProducts } = require('../shared/initialData');
const { traceMiddleware } = require('../shared/traceMiddleware');

const app = express();
const PORT = process.env.PORT || 5003;
const SERVICE_NAME = 'Catalog-Service';

app.use(cors());
app.use(express.json());
app.use(traceMiddleware(SERVICE_NAME));

// Isolated Database for Product Catalog
let productsDb = JSON.parse(JSON.stringify(initialProducts));

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: SERVICE_NAME, port: PORT });
});

app.get('/products', (req, res) => {
  const { category, search } = req.query;
  let results = [...productsDb];

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
      port: PORT,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

app.get('/products/:id', (req, res) => {
  const product = productsDb.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found in Catalog Service' });
  }
  res.json({
    success: true,
    product,
    architectureTrace: {
      service: SERVICE_NAME,
      port: PORT,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

// Internal event handler: update catalog stock snapshot when inventory changes
app.put('/products/:id/stock', (req, res) => {
  const { stock } = req.body;
  const product = productsDb.find(p => p.id === req.params.id);
  if (product) {
    product.stock = stock;
  }
  res.json({ success: true, product });
});

app.listen(PORT, () => {
  console.log(`[MICROSERVICE] ${SERVICE_NAME} running on port ${PORT}`);
});
