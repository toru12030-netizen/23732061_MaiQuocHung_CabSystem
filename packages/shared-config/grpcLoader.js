const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_OPTIONS = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
};

function loadProto(protoFileName) {
  const protoPath = path.resolve(__dirname, '../proto', protoFileName);
  const packageDefinition = protoLoader.loadSync(protoPath, PROTO_OPTIONS);
  return grpc.loadPackageDefinition(packageDefinition);
}

module.exports = {
  loadProto,
  grpc
};
