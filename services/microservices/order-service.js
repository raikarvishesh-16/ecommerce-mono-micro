const express = require('express');
const cors = require('cors');
const { traceMiddleware } = require('../shared/traceMiddleware');

const app = express();
const PORT = process.env.PORT || 5005;
const SERVICE_NAME = 'Order-Service';

app.use(cors());
app.use(express.json());
app.use(traceMiddleware(SERVICE_NAME));

// Isolated Database for Orders
let ordersDb = [];

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: SERVICE_NAME, port: PORT });
});

app.get('/orders', (req, res) => {
  res.json({
    success: true,
    total: ordersDb.length,
    orders: ordersDb,
    architectureTrace: {
      service: SERVICE_NAME,
      port: PORT,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

// Distributed Saga Orchestrator for Checkout
app.post('/orders/checkout', async (req, res) => {
  const userId = 'user-demo';
  const traceId = req.traceId;
  const currentHop = req.hopCount;
  const sagaSteps = [];
  const traceHeaders = {
    'Content-Type': 'application/json',
    'x-trace-id': traceId,
    'x-hop-count': (currentHop + 1).toString()
  };

  try {
    // SAGA STEP 1: Fetch user's cart from Cart Service (Port 5004)
    const t0 = Date.now();
    const cartRes = await fetch('http://localhost:5004/cart', { headers: traceHeaders });
    if (!cartRes.ok) throw new Error('Cart Service request failed');
    const cartData = await cartRes.json();
    const cart = cartData.cart;

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    sagaSteps.push({
      step: '1. Cart Retrieval',
      service: 'Cart-Service (5004)',
      status: 'SUCCESS',
      latencyMs: Date.now() - t0,
      detail: `Fetched ${cart.items.length} items from Cart microservice`
    });

    const reservationPayload = {
      items: cart.items.map(i => ({ productId: i.productId, quantity: i.quantity }))
    };

    // SAGA STEP 2: Reserve Stock via Inventory Service (Port 5006)
    const t1 = Date.now();
    const invRes = await fetch('http://localhost:5006/inventory/reserve', {
      method: 'POST',
      headers: traceHeaders,
      body: JSON.stringify(reservationPayload)
    });

    const invData = await invRes.json();
    if (!invRes.ok || !invData.success) {
      sagaSteps.push({
        step: '2. Inventory Reservation',
        service: 'Inventory-Service (5006)',
        status: 'FAILED',
        latencyMs: Date.now() - t1,
        detail: invData.message || 'Stock reservation failed'
      });
      return res.status(400).json({
        success: false,
        message: `Saga aborted at Inventory Service: ${invData.message}`,
        sagaSteps
      });
    }

    sagaSteps.push({
      step: '2. Inventory Reservation',
      service: 'Inventory-Service (5006)',
      status: 'SUCCESS',
      latencyMs: Date.now() - t1,
      detail: `Successfully locked stock partitions (Reservation: ${invData.reservationId})`
    });

    // SAGA STEP 3: Process Simulated Payment (Simulated Third-Party / Payment Module)
    const t2 = Date.now();
    await new Promise(r => setTimeout(r, 60)); // simulate distributed payment gateway latency
    sagaSteps.push({
      step: '3. Payment Processing',
      service: 'Payment-Gateway (External)',
      status: 'SUCCESS',
      latencyMs: Date.now() - t2,
      detail: `Authorized payment of ₹${cart.subtotal.toLocaleString('en-IN')}`
    });

    // SAGA STEP 4: Persist Order Entity into Order Service Database
    const t3 = Date.now();
    const newOrder = {
      id: `ord-micro-${Date.now().toString(36).toUpperCase()}`,
      userId,
      items: cart.items.map(i => ({
        productId: i.productId,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.image
      })),
      totalAmount: cart.subtotal,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      executionType: 'Distributed Saga Orchestrator across 5 Microservices',
      totalHops: currentHop + 4,
      sagaSteps
    };

    ordersDb.unshift(newOrder);

    sagaSteps.push({
      step: '4. Order Persistence',
      service: 'Order-Service (5005)',
      status: 'SUCCESS',
      latencyMs: Date.now() - t3,
      detail: `Order ${newOrder.id} saved in Order Service database`
    });

    // SAGA STEP 5: Clear User Cart via Cart Service (Port 5004)
    fetch('http://localhost:5004/cart', {
      method: 'DELETE',
      headers: traceHeaders
    }).catch(err => console.error('[ORDER-SERVICE] Async cart clear failed:', err));

    // SAGA STEP 6: Publish Domain Event to Event Bus (Port 5007)
    const t4 = Date.now();
    fetch('http://localhost:5007/events/publish', {
      method: 'POST',
      headers: traceHeaders,
      body: JSON.stringify({
        eventType: 'ORDER_PLACED',
        sourceService: SERVICE_NAME,
        payload: {
          orderId: newOrder.id,
          userId,
          totalAmount: newOrder.totalAmount,
          itemCount: newOrder.items.length
        }
      })
    }).then(res => res.json()).then(evtData => {
      console.log(`[ORDER-SERVICE] Event published to Event Bus in ${Date.now() - t4}ms`);
    }).catch(err => console.error('[ORDER-SERVICE] Async event publish failed:', err));

    sagaSteps.push({
      step: '5. Event Bus Broadcast',
      service: 'Event-Bus (5007)',
      status: 'DISPATCHED_ASYNC',
      latencyMs: 12,
      detail: 'Broadcasted "ORDER_PLACED" event to decoupled subscribers'
    });

    res.json({
      success: true,
      message: 'Distributed Saga checkout completed successfully across microservices',
      order: newOrder,
      architectureTrace: {
        service: SERVICE_NAME,
        port: PORT,
        hopCount: currentHop + 4,
        traceId,
        architecture: 'Microservices (Saga Orchestration)'
      }
    });

  } catch (error) {
    console.error('[ORDER-SERVICE] Saga orchestration exception:', error);
    res.status(500).json({
      success: false,
      message: 'Distributed Saga failure: ' + error.message,
      sagaSteps
    });
  }
});

app.listen(PORT, () => {
  console.log(`[MICROSERVICE] ${SERVICE_NAME} running on port ${PORT}`);
});
