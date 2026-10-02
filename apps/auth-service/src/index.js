const express = require('express');
const cors = require('cors');
const config = require('./config');
const { initDb } = require('./config/db');
const { loadProto, grpc } = require('@cab/shared-config');
const authGrpcService = require('./services/authGrpcService');

const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'auth-service',
    status: 'UP',
    grpcPort: 50051,
    timestamp: new Date().toISOString()
  });
});

// Mount modular auth HTTP routes
app.use('/auth', authRoutes);
app.use('/', authRoutes);

// Khởi chạy gRPC Server
function startGrpcServer() {
  const authProto = loadProto('auth.proto');
  const server = new grpc.Server();

  server.addService(authProto.auth.AuthService.service, {
    Register: authGrpcService.register,
    Login: authGrpcService.login,
    Logout: authGrpcService.logout,
    ValidateToken: authGrpcService.validateToken
  });

  const GRPC_PORT = process.env.GRPC_PORT || '50051';
  server.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('[AUTH_SERVICE gRPC] Failed to bind:', err);
        return;
      }
      console.log(`[AUTH_SERVICE gRPC] Server running on port ${port}`);
    }
  );
}

// Khởi chạy cả HTTP (health check) và gRPC (nghiệp vụ chính)
async function startServer() {
  await initDb();
  startGrpcServer();

  app.listen(config.port, () => {
    console.log(`[AUTH_SERVICE HTTP] Listening on port ${config.port}`);
  });
}

startServer().catch((err) => {
  console.error('[AUTH_SERVICE] Fatal error:', err);
});

module.exports = app;
