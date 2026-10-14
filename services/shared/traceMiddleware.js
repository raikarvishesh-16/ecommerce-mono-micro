// Request tracing and logging middleware for telemetry

function traceMiddleware(serviceName) {
  return (req, res, next) => {
    // Read or generate trace ID
    const traceId = req.headers['x-trace-id'] || `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const hops = parseInt(req.headers['x-hop-count'] || '0', 10) + 1;
    const startTime = Date.now();

    req.traceId = traceId;
    req.hopCount = hops;

    res.setHeader('x-trace-id', traceId);
    res.setHeader('x-hop-count', hops.toString());
    res.setHeader('x-served-by', serviceName);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] [${serviceName}] [${traceId}] ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${duration}ms) [Hop: ${hops}]`);
    });

    next();
  };
}

module.exports = { traceMiddleware };
