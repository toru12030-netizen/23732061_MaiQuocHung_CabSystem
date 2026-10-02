const { customerClient, mapGrpcErrorToHttp } = require('../grpc/grpcClients');
const { sendSuccess } = require('@cab/shared-config');

/**
 * REST: POST /api/v1/customers -> gRPC: CreateCustomer (Yêu cầu role=admin)
 */
function createCustomer(req, res) {
  const { uid, fullname, age, address } = req.body;

  customerClient.CreateCustomer({ uid, fullname, age, address }, (err, response) => {
    if (err) {
      return mapGrpcErrorToHttp(err, res);
    }
    return sendSuccess(res, response.data, 201, response.message);
  });
}

/**
 * REST: GET /api/v1/customers/:uid -> gRPC: GetCustomer (Yêu cầu role=member hoặc admin)
 */
function getCustomer(req, res) {
  const uid = req.params.uid;

  customerClient.GetCustomer({ uid }, (err, response) => {
    if (err) {
      return mapGrpcErrorToHttp(err, res);
    }
    return sendSuccess(res, response.data, 200, response.message);
  });
}

/**
 * REST: GET /api/v1/customers -> gRPC: ListCustomers (Yêu cầu role=member hoặc admin)
 */
function listCustomers(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  customerClient.ListCustomers({ page, limit }, (err, response) => {
    if (err) {
      return mapGrpcErrorToHttp(err, res);
    }
    return sendSuccess(res, {
      customers: response.data,
      total: response.total,
      page: response.page,
      limit: response.limit
    }, 200, response.message);
  });
}

/**
 * REST: PUT /api/v1/customers/:uid -> gRPC: UpdateCustomer (Yêu cầu role=admin)
 */
function updateCustomer(req, res) {
  const uid = req.params.uid;
  const { fullname, age, address } = req.body;

  customerClient.UpdateCustomer({ uid, fullname, age, address }, (err, response) => {
    if (err) {
      return mapGrpcErrorToHttp(err, res);
    }
    return sendSuccess(res, response.data, 200, response.message);
  });
}

/**
 * REST: DELETE /api/v1/customers/:uid -> gRPC: DeleteCustomer (Yêu cầu role=admin)
 */
function deleteCustomer(req, res) {
  const uid = req.params.uid;

  customerClient.DeleteCustomer({ uid }, (err, response) => {
    if (err) {
      return mapGrpcErrorToHttp(err, res);
    }
    return sendSuccess(res, null, 200, response.message);
  });
}

module.exports = {
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
  deleteCustomer
};
