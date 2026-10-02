const express = require('express');
const cors = require('cors');
const { connectDb } = require('./config/db');
const { loadProto, grpc } = require('@cab/shared-config');
const customerGrpcService = require('./services/customerGrpcService');

const app = express();
const HTTP_PORT = process.env.PORT || 3007;
const GRPC_PORT = process.env.GRPC_PORT || '50052';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'customer-service',
    status: 'UP',
    grpcPort: Number(GRPC_PORT),
    timestamp: new Date().toISOString()
  });
});

// Khởi chạy gRPC Server
function startGrpcServer() {
  const customerProto = loadProto('customer.proto');
  const server = new grpc.Server();

  server.addService(customerProto.customer.CustomerService.service, {
    CreateCustomer: customerGrpcService.createCustomer,
    GetCustomer: customerGrpcService.getCustomer,
    ListCustomers: customerGrpcService.listCustomers,
    UpdateCustomer: customerGrpcService.updateCustomer,
    DeleteCustomer: customerGrpcService.deleteCustomer
  });

  server.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('[CUSTOMER_SERVICE gRPC] Failed to bind:', err);
        return;
      }
      console.log(`[CUSTOMER_SERVICE gRPC] Server running on port ${port}`);
    }
  );
}

// Khởi chạy server
async function startServer() {
  await connectDb();
  startGrpcServer();

  app.listen(HTTP_PORT, () => {
    console.log(`[CUSTOMER_SERVICE HTTP] Listening on port ${HTTP_PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[CUSTOMER_SERVICE] Fatal error:', err);
});

module.exports = app;
