const { getCollection } = require('../config/db');
const { grpc } = require('@cab/shared-config');

/**
 * 1. Create Customer (Cần role=admin tại Gateway)
 * Schema: (uid, fullname, age, address)
 */
async function createCustomer(call, callback) {
  try {
    const col = getCollection();
    const { uid, fullname, age, address } = call.request;

    if (!uid || !fullname) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'uid and fullname are required'
      });
    }

    const existing = await col.findOne({ uid });
    if (existing) {
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        message: `Customer with uid '${uid}' already exists`
      });
    }

    const now = new Date().toISOString();
    const newCustomer = {
      uid,
      fullname,
      age: Number(age) || 0,
      address: address || '',
      createdAt: now,
      updatedAt: now
    };

    await col.insertOne(newCustomer);

    return callback(null, {
      success: true,
      message: 'Customer created successfully',
      data: newCustomer
    });
  } catch (error) {
    console.error('[CUSTOMER_GRPC CREATE ERROR]:', error);
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
}

/**
 * 2. Get Customer by UID (Cần role=member hoặc admin tại Gateway)
 */
async function getCustomer(call, callback) {
  try {
    const col = getCollection();
    const { uid } = call.request;

    if (!uid) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'uid is required'
      });
    }

    const customer = await col.findOne({ uid }, { projection: { _id: 0 } });
    if (!customer) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: `Customer not found with uid: ${uid}`
      });
    }

    return callback(null, {
      success: true,
      message: 'Customer retrieved successfully',
      data: customer
    });
  } catch (error) {
    console.error('[CUSTOMER_GRPC GET ERROR]:', error);
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
}

/**
 * 3. List Customers (Cần role=member hoặc admin tại Gateway)
 */
async function listCustomers(call, callback) {
  try {
    const col = getCollection();
    const page = Math.max(1, Number(call.request.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(call.request.limit) || 20));
    const skip = (page - 1) * limit;

    const total = await col.countDocuments();
    const list = await col
      .find({}, { projection: { _id: 0 } })
      .skip(skip)
      .limit(limit)
      .toArray();

    return callback(null, {
      success: true,
      message: 'Customer list retrieved successfully',
      data: list,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('[CUSTOMER_GRPC LIST ERROR]:', error);
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
}

/**
 * 4. Update Customer (Cần role=admin tại Gateway)
 */
async function updateCustomer(call, callback) {
  try {
    const col = getCollection();
    const { uid, fullname, age, address } = call.request;

    if (!uid) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'uid is required'
      });
    }

    const updateDoc = {
      updatedAt: new Date().toISOString()
    };
    if (fullname) updateDoc.fullname = fullname;
    if (age !== undefined && age !== null) updateDoc.age = Number(age);
    if (address !== undefined) updateDoc.address = address;

    const result = await col.findOneAndUpdate(
      { uid },
      { $set: updateDoc },
      { returnDocument: 'after', projection: { _id: 0 } }
    );

    if (!result) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: `Customer not found with uid: ${uid}`
      });
    }

    return callback(null, {
      success: true,
      message: 'Customer updated successfully',
      data: result
    });
  } catch (error) {
    console.error('[CUSTOMER_GRPC UPDATE ERROR]:', error);
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
}

/**
 * 5. Delete Customer (Cần role=admin tại Gateway)
 */
async function deleteCustomer(call, callback) {
  try {
    const col = getCollection();
    const { uid } = call.request;

    if (!uid) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'uid is required'
      });
    }

    const result = await col.deleteOne({ uid });
    if (result.deletedCount === 0) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: `Customer not found with uid: ${uid}`
      });
    }

    return callback(null, {
      success: true,
      message: `Customer with uid '${uid}' deleted successfully`
    });
  } catch (error) {
    console.error('[CUSTOMER_GRPC DELETE ERROR]:', error);
    return callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
}

module.exports = {
  createCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
  deleteCustomer
};
