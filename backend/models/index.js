const sequelize = require('../config/db');

const User = require('./User.model');
const Role = require('./Role.model');
const Company = require('./Company.model');
const Warehouse = require('./Warehouse.model');
const Order = require('./Order.model');


// Role associations
Role.hasMany(User, { as: 'users', foreignKey: 'role_id' });

// User associations
User.belongsTo(Role, { as: 'role', foreignKey: 'role_id' });
User.belongsTo(Company, { as: 'company', foreignKey: 'company_id' });
User.belongsTo(Warehouse, { as: 'warehouse', foreignKey: 'warehouse_id' });
User.hasMany(Order, { as: 'assignedOrders', foreignKey: 'driver_id' });
User.hasMany(Order, { as: 'createdOrders', foreignKey: 'created_by' });

// Company associations
Company.hasMany(User, { as: 'users', foreignKey: 'company_id' });
Company.hasMany(Order, { as: 'orders', foreignKey: 'company_id' });
Company.hasMany(Warehouse, { as: 'warehouses', foreignKey: 'company_id' });

// Warehouse associations
Warehouse.belongsTo(Company, { as: 'company', foreignKey: 'company_id' });
Warehouse.hasMany(Order, { as: 'orders', foreignKey: 'warehouse_id' });
Warehouse.hasMany(User, { as: 'employees', foreignKey: 'warehouse_id' });

// Order associations
Order.belongsTo(Company, { as: 'company', foreignKey: 'company_id' });
Order.belongsTo(Warehouse, { as: 'warehouse', foreignKey: 'warehouse_id' });
Order.belongsTo(User, { as: 'driver', foreignKey: 'driver_id' });
Order.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });

module.exports = {
  sequelize,
  User,
  Role,
  Company,
  Warehouse,
  Order
};
