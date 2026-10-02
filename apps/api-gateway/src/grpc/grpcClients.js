const { loadProto, grpc } = require('@cab/shared-config');

const AUTH_GRPC_HOST = process.env.AUTH_GRPC_HOST || 'auth-service:50051';
const CUSTOMER_GRPC_HOST = process.env.CUSTOMER_GRPC_HOST || 'customer-service:50052';

const authProto = loadProto('auth.proto');
const customerProto = loadProto('customer.proto');

const authClient = new authProto.auth.AuthService(
  AUTH_GRPC_HOST,
  grpc.credentials.createInsecure()
);

const customerClient = new customerProto.customer.CustomerService(
  CUSTOMER_GRPC_HOST,
  grpc.credentials.createInsecure()
);

/**
 * Hàm chuyển đổi mã lỗi gRPC sang mã HTTP Status tương ứng
 */
function mapGrpcErrorToHttp(grpcErr, res) {
  const status = grpcErr.code;
  const message = grpcErr.details || grpcErr.message || 'Error occurred';

  let httpStatus = 500;
  let errorCode = 'INTERNAL_ERROR';

  switch (status) {
    case grpc.status.INVALID_ARGUMENT: // 3
      httpStatus = 400;
      errorCode = 'BAD_REQUEST';
      break;
    case grpc.status.UNAUTHENTICATED: // 16
      httpStatus = 401;
      errorCode = 'UNAUTHORIZED';
      break;
    case grpc.status.PERMISSION_DENIED: // 7
      httpStatus = 403;
      errorCode = 'FORBIDDEN';
      break;
    case grpc.status.NOT_FOUND: // 5
      httpStatus = 404;
      errorCode = 'NOT_FOUND';
      break;
    case grpc.status.ALREADY_EXISTS: // 6
      httpStatus = 409;
      errorCode = 'CONFLICT';
      break;
    case grpc.status.UNAVAILABLE: // 14
      httpStatus = 503;
      errorCode = 'SERVICE_UNAVAILABLE';
      break;
    default:
      httpStatus = 500;
      errorCode = 'INTERNAL_SERVER_ERROR';
  }

  return res.status(httpStatus).json({
    success: false,
    error: {
      code: errorCode,
      message,
      grpcCode: status
    }
  });
}

module.exports = {
  authClient,
  customerClient,
  mapGrpcErrorToHttp
};
