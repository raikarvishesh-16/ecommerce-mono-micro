const express = require('express');
const cors = require('cors');
const { initialUsers } = require('../shared/initialData');
const { traceMiddleware } = require('../shared/traceMiddleware');

const app = express();
const PORT = process.env.PORT || 5002;
const SERVICE_NAME = 'Auth-Service';

app.use(cors());
app.use(express.json());
app.use(traceMiddleware(SERVICE_NAME));

// Isolated Database for Auth Service (Database-per-Service Pattern)
let usersDb = JSON.parse(JSON.stringify(initialUsers));

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: SERVICE_NAME, port: PORT });
});

app.get('/auth/me', (req, res) => {
  const user = usersDb[0];
  res.json({
    success: true,
    user,
    architectureTrace: {
      service: SERVICE_NAME,
      port: PORT,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

app.listen(PORT, () => {
  console.log(`[MICROSERVICE] ${SERVICE_NAME} running on port ${PORT}`);
});
