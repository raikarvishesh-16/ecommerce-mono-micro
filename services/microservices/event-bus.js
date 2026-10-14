const express = require('express');
const cors = require('cors');
const { traceMiddleware } = require('../shared/traceMiddleware');

const app = express();
const PORT = process.env.PORT || 5007;
const SERVICE_NAME = 'Event-Bus';

app.use(cors());
app.use(express.json());
app.use(traceMiddleware(SERVICE_NAME));

// Asynchronous Domain Event Store / Audit Log
let eventsLog = [];

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: SERVICE_NAME, port: PORT });
});

app.get('/events', (req, res) => {
  res.json({
    success: true,
    total: eventsLog.length,
    events: eventsLog,
    architectureTrace: {
      service: SERVICE_NAME,
      port: PORT,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

app.post('/events/publish', (req, res) => {
  const { eventType, payload, sourceService } = req.body;
  const event = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventType,
    sourceService: sourceService || 'Unknown',
    payload,
    timestamp: new Date().toISOString(),
    traceId: req.traceId
  };

  eventsLog.unshift(event);
  if (eventsLog.length > 50) eventsLog.pop(); // keep last 50 events

  console.log(`[EVENT BUS] Published Domain Event: "${eventType}" from ${sourceService}`);

  res.json({
    success: true,
    message: `Event "${eventType}" acknowledged and broadcasted to subscribers`,
    event,
    architectureTrace: {
      service: SERVICE_NAME,
      port: PORT,
      hopCount: req.hopCount,
      traceId: req.traceId
    }
  });
});

app.delete('/events', (req, res) => {
  eventsLog = [];
  res.json({ success: true, message: 'Event store cleared' });
});

app.listen(PORT, () => {
  console.log(`[MICROSERVICE] ${SERVICE_NAME} running on port ${PORT}`);
});
