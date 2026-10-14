const express = require('express');
const cors = require('cors');
const { traceMiddleware } = require('../shared/traceMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;
const GATEWAY_NAME = 'API-Gateway';

app.use(cors());
app.use(express.json());
app.use(traceMiddleware(GATEWAY_NAME));

// Microservice Route Table / Service Registry
const SERVICE_REGISTRY = {
  auth: { name: 'Auth-Service', url: 'http://localhost:5002', port: 5002, role: 'Authentication & User Identity' },
  catalog: { name: 'Catalog-Service', url: 'http://localhost:5003', port: 5003, role: 'Products & Category Management' },
  cart: { name: 'Cart-Service', url: 'http://localhost:5004', port: 5004, role: 'Shopping Cart Session Management' },
  order: { name: 'Order-Service', url: 'http://localhost:5005', port: 5005, role: 'Order Processing & Saga Orchestrator' },
  inventory: { name: 'Inventory-Service', url: 'http://localhost:5006', port: 5006, role: 'Stock Reservation & Warehouse Partition' },
  events: { name: 'Event-Bus', url: 'http://localhost:5007', port: 5007, role: 'Asynchronous Event Broker & Audit Log' }
};

let gatewayMetrics = {
  totalRequests: 0,
  routedRequests: {
    auth: 0,
    catalog: 0,
    cart: 0,
    order: 0,
    inventory: 0,
    events: 0
  }
};

app.use((req, res, next) => {
  gatewayMetrics.totalRequests++;
  next();
});

// Helper proxy forwarder
async function proxyRequest(targetUrl, targetPath, serviceKey, req, res) {
  gatewayMetrics.routedRequests[serviceKey] = (gatewayMetrics.routedRequests[serviceKey] || 0) + 1;
  const fullTarget = `${targetUrl}${targetPath}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'x-trace-id': req.traceId,
    'x-hop-count': (req.hopCount || 1).toString(),
    'x-gateway-forwarded-by': GATEWAY_NAME
  };

  try {
    const fetchOptions = {
      method: req.method,
      headers
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const targetRes = await fetch(fullTarget, fetchOptions);
    const contentType = targetRes.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await targetRes.json();
      return res.status(targetRes.status).json(data);
    } else {
      const text = await targetRes.text();
      return res.status(targetRes.status).send(text);
    }
  } catch (error) {
    console.error(`[GATEWAY] Routing error to ${SERVICE_REGISTRY[serviceKey].name}:`, error.message);
    return res.status(502).json({
      success: false,
      message: `Gateway Error: Unable to reach ${SERVICE_REGISTRY[serviceKey].name} at ${targetUrl}`,
      error: error.message,
      gatewayTrace: {
        service: GATEWAY_NAME,
        traceId: req.traceId,
        destination: targetUrl
      }
    });
  }
}

// ==========================================
// 1. Topology & Real-Time Service Health Aggregator
// ==========================================
app.get('/api/topology', async (req, res) => {
  const serviceChecks = await Promise.all(
    Object.entries(SERVICE_REGISTRY).map(async ([key, info]) => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        const healthRes = await fetch(`${info.url}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        const latencyMs = Date.now() - start;
        return {
          id: key,
          name: info.name,
          port: info.port,
          url: info.url,
          role: info.role,
          status: healthRes.ok ? 'HEALTHY' : 'DEGRADED',
          statusCode: healthRes.status,
          latencyMs
        };
      } catch (err) {
        return {
          id: key,
          name: info.name,
          port: info.port,
          url: info.url,
          role: info.role,
          status: 'UNAVAILABLE',
          error: err.name === 'AbortError' ? 'Timeout' : err.message,
          latencyMs: Date.now() - start
        };
      }
    })
  );

  const mem = process.memoryUsage();
  res.json({
    architecture: 'Microservices',
    mode: 'microservices',
    gatewayPort: PORT,
    gatewayName: GATEWAY_NAME,
    characteristics: {
      deployment: '6 Autonomous decoupled microservices + 1 API Gateway',
      database: 'Database-per-Service (Isolated state stores)',
      communication: 'REST HTTP & Asynchronous Event Broker (EDA)',
      latencyProfile: 'Network hop overhead compensated by modular horizontal scalability',
      failureBlastRadius: 'Isolated (Circuit breaker prevents cascading failures)'
    },
    services: serviceChecks,
    telemetry: {
      gatewayUptime: Math.floor(process.uptime()),
      gatewayHeapMB: (mem.heapUsed / 1024 / 1024).toFixed(2),
      totalGatewayRequests: gatewayMetrics.totalRequests,
      routedRequests: gatewayMetrics.routedRequests,
      servicesCount: serviceChecks.length,
      activeServicesCount: serviceChecks.filter(s => s.status === 'HEALTHY').length
    }
  });
});

// ==========================================
// 2. Proxied Routes
// ==========================================

// Auth
app.use('/api/auth', (req, res) => {
  const path = req.originalUrl.replace(/^\/api/, '');
  proxyRequest(SERVICE_REGISTRY.auth.url, path, 'auth', req, res);
});

// Products & Catalog
app.use('/api/products', (req, res) => {
  const path = req.originalUrl.replace(/^\/api/, '');
  proxyRequest(SERVICE_REGISTRY.catalog.url, path, 'catalog', req, res);
});

// Shopping Cart
app.use('/api/cart', (req, res) => {
  const path = req.originalUrl.replace(/^\/api/, '');
  proxyRequest(SERVICE_REGISTRY.cart.url, path, 'cart', req, res);
});

// Orders & Saga Checkout
app.use('/api/orders', (req, res) => {
  const path = req.originalUrl.replace(/^\/api/, '');
  proxyRequest(SERVICE_REGISTRY.order.url, path, 'order', req, res);
});

// Inventory
app.use('/api/inventory', (req, res) => {
  const path = req.originalUrl.replace(/^\/api/, '');
  proxyRequest(SERVICE_REGISTRY.inventory.url, path, 'inventory', req, res);
});

// Event Bus
app.use('/api/events', (req, res) => {
  const path = req.originalUrl.replace(/^\/api/, '');
  proxyRequest(SERVICE_REGISTRY.events.url, path, 'events', req, res);
});

app.listen(PORT, () => {
  console.log(`[GATEWAY] API Gateway running at http://localhost:${PORT}`);
  console.log(`[GATEWAY] Routing requests to 6 distributed microservices`);
});
