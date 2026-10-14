# Nexus Commerce — Monolithic & Microservices Dual-Architecture Platform

A comprehensive, production-grade E-Commerce application demonstrating and contrasting **Monolithic Architecture** vs **Microservices Architecture** side-by-side using **Node.js/Express** and **React**.

---

## 🌟 Key Features

1. **Dual-Architecture Mode Switcher**:
   - Toggle seamlessly in real-time between **Monolithic Mode** (`http://localhost:5001`) and **Microservices Mode** (`http://localhost:5000` via API Gateway).
2. **Side-by-Side Architectural Contrast**:
   - **Monolith**: Single unified process, in-memory unified database, synchronous direct in-process method execution, sub-millisecond local transactions.
   - **Microservices**: 6 decoupled services + 1 API Gateway, **Database-per-Service** pattern, inter-service HTTP REST, and an asynchronous Event Bus for domain events (`ORDER_PLACED`).
3. **Distributed Saga Pattern Orchestrator**:
   - Real-time visualization of the Saga pattern during checkout across `Order-Service` (Orchestrator), `Cart-Service`, `Inventory-Service` (Stock Reservation & Compensating Transactions), and `Event-Bus`.
4. **Live System Topology & Node Telemetry**:
   - Live health checks, latency gauges (ms), port registry, memory consumption, and hop-counter propagation (`x-trace-id`, `x-hop-count`).
5. **Chaos & Resilience Engineering Simulator**:
   - Inject artificial latency or simulate complete service outages in the `Inventory-Service` to observe fault isolation and circuit breaking without bringing down the product catalog or auth.
6. **Architectural Comparison Matrix**:
   - In-depth engineering breakdown analyzing latency, data consistency (ACID vs Eventual Consistency), blast radius, scalability granularity, deployment complexity, and team velocity.

---

## 🏗️ Architecture Blueprint

### 1. Monolithic Architecture (`Port 5001`)
```
+--------------------------------------------------------------+
|                     Monolith Core (Port 5001)                |
|                                                              |
|  [ Auth Module ]       [ Product Catalog ]     [ Cart ]      |
|  [ Order Engine ]      [ Inventory Module ]    [ Billing ]   |
|                                                              |
|                    Unified In-Memory Database                |
+--------------------------------------------------------------+
```
- **Hops**: 1 (Client -> Monolith)
- **Data Store**: Single shared database
- **Execution**: Synchronous ACID transaction

### 2. Microservices Architecture (`Port 5000 - 5007`)
```
                    [ React Client Frontend ]
                                |
                                v
                    +-----------------------+
                    |  API Gateway (:5000)  |
                    +-----------------------+
                     /    |     |     |    \
                    /     |     |     |     \
                   v      v     v     v      v
              +-------++-------++-------++-------++-------+
              | Auth  ||Catalog|| Cart  || Order || Inven |
              |:5002  ||:5003  ||:5004  ||:5005  ||:5006  |
              +-------++-------++-------++-------++-------+
                 |        |        |        |        |
               [DB 1]   [DB 2]   [DB 3]   [DB 4]   [DB 5]
                                            |
                                            v
                                  +-------------------+
                                  |  Event Bus (:5007)|
                                  +-------------------+
```
- **Hops**: Client -> Gateway (Hop 1) -> Order Service (Hop 2) -> Cart (Hop 3) -> Inventory (Hop 4) -> Event Bus (Hop 5)
- **Data Store**: Database-per-service (Isolated partitions)
- **Execution**: Distributed Saga transaction with compensating rollbacks

---

## 🚀 Service Port Reference Table

| Service / Component | Port | Role & Domain Boundary | Architecture |
| :--- | :--- | :--- | :--- |
| **Client Frontend** | `5173` | Modern React + Vite UI with Live Switcher | Both |
| **API Gateway** | `5000` | Reverse proxy, trace ID injection, topology aggregator | Microservices |
| **Monolith Core** | `5001` | Single unified deployment unit hosting all modules | Monolithic |
| **Auth Service** | `5002` | User profiles, authentication & identity | Microservices |
| **Catalog Service** | `5003` | Product catalog, categories, search & specs | Microservices |
| **Cart Service** | `5004` | Shopping cart sessions & populated subtotal | Microservices |
| **Order Service** | `5005` | Saga orchestrator, order persistence & history | Microservices |
| **Inventory Service**| `5006` | Stock reservation, locks, and chaos injector | Microservices |
| **Event Bus** | `5007` | Domain pub/sub broker & audit event log | Microservices |

---

## ⚡ Quick Start Instructions

From the root project directory: `C:\Users\vishesh\.gemini\antigravity-ide\scratch\ecommerce-mono-micro`

### Option 1: Run Everything Concurrently (Recommended)
Launches the Monolith, all 6 Microservices, the API Gateway, and the React frontend simultaneously:
```bash
npm run dev
```
Then open your browser at **`http://localhost:5173`**.

### Option 2: Run Monolith Alone
```bash
# Terminal 1: Monolithic backend
npm run start:monolith

# Terminal 2: Frontend client
npm run start:client
```

### Option 3: Run Microservices Alone
```bash
# Terminal 1: Microservices suite + API Gateway
npm run start:microservices

# Terminal 2: Frontend client
npm run start:client
```

---

## 🧪 Interactive Demonstrations to Try

1. **Real-Time Mode Toggle**:
   - In the top header bar, click **Monolith** or **Microservices**.
   - Notice the active target URL, ping latency, and database architecture change immediately.
2. **Checkout Saga Visualizer**:
   - Add items to your cart and click **Checkout**.
   - In **Microservices mode**, watch the visual timeline break down each step of the distributed Saga (Cart retrieval -> Inventory reservation -> Payment simulation -> Order persistence -> Event Bus broadcast).
   - In **Monolith mode**, watch the same operation resolve as a single in-process ACID commit.
3. **Resilience & Fault Isolation (Chaos Mode)**:
   - Navigate to the **System Topology** tab in Microservices mode.
   - Click **"Simulate Inventory Service Failure (503)"**.
   - Notice how you can still browse products, search, and manage your user profile—faults in one service do not take down the entire system!
