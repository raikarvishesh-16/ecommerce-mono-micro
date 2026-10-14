const express = require('express');
const cors = require('cors');
const { initialProducts } = require('../shared/initialData');
const { traceMiddleware } = require('../shared/traceMiddleware');

const app = express();
const PORT = process.env.PORT || 5006;
const SERVICE_NAME = 'Inventory-Service';

app.use(cors());
app.use(express.json());
app.use(traceMiddleware(SERVICE_NAME));

// Isolated Database for Inventory Service
let inventoryDb = {};
initialProducts.forEach(p => {
  inventoryDb[p.id] = {
    productId: p.id,
    stock: p.stock,
    reserved: 0
  };
});

// Chaos engineering / resilience simulation state
let simulateLatencyMs = 0;
let simulateFailure = false;

app.get('/health', (req, res) => {
  if (simulateFailure) {
    return res.status(503).json({ status: 'DOWN', service: SERVICE_NAME, error: 'Simulated Service Degradation/Crash' });
  }
  res.json({ status: 'UP', service: SERVICE_NAME, port: PORT });
});

app.get('/inventory/:productId', async (req, res) => {
  if (simulateLatencyMs > 0) {
    await new Promise(r => setTimeout(r, simulateLatencyMs));
  }
  if (simulateFailure) {
    return res.status(503).json({ success: false, message: 'Inventory Service is temporarily unavailable (Chaos Simulation)' });
  }

  const item = inventoryDb[req.params.productId];
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found in warehouse' });
  }
  res.json({
    success: true,
    inventory: item,
    architectureTrace: {
      service: SERVICE_NAME,
      port: PORT,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

// Reservation endpoint used by the Order Service Saga
app.post('/inventory/reserve', async (req, res) => {
  if (simulateLatencyMs > 0) {
    await new Promise(r => setTimeout(r, simulateLatencyMs));
  }
  if (simulateFailure) {
    return res.status(503).json({ success: false, message: 'Inventory Service unavailable: Saga reservation failed' });
  }

  const { items } = req.body; // array of { productId, quantity }
  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'Items list required' });
  }

  // Check stock availability
  for (const item of items) {
    const stockRecord = inventoryDb[item.productId];
    if (!stockRecord || (stockRecord.stock - stockRecord.reserved) < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Inventory shortfall for ${item.productId}: available ${stockRecord ? stockRecord.stock - stockRecord.reserved : 0}, requested ${item.quantity}`
      });
    }
  }

  // Reserve items (Saga step)
  for (const item of items) {
    inventoryDb[item.productId].stock -= item.quantity;
  }

  res.json({
    success: true,
    message: 'Stock successfully reserved across distributed warehouse partition',
    reservationId: `res-${Date.now()}`,
    architectureTrace: {
      service: SERVICE_NAME,
      port: PORT,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

// Compensating transaction endpoint in case Saga fails downstream
app.post('/inventory/release', (req, res) => {
  const { items } = req.body;
  if (items && items.length) {
    items.forEach(item => {
      if (inventoryDb[item.productId]) {
        inventoryDb[item.productId].stock += item.quantity;
      }
    });
  }
  res.json({
    success: true,
    message: 'Compensating transaction executed: Stock released back to pool',
    architectureTrace: {
      service: SERVICE_NAME,
      port: PORT,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

// Chaos simulator control
app.post('/inventory/chaos', (req, res) => {
  const { latencyMs = 0, fail = false } = req.body;
  simulateLatencyMs = latencyMs;
  simulateFailure = fail;
  res.json({
    success: true,
    chaosConfig: { simulateLatencyMs, simulateFailure },
    message: 'Chaos parameters updated'
  });
});

app.listen(PORT, () => {
  console.log(`[MICROSERVICE] ${SERVICE_NAME} running on port ${PORT}`);
});
