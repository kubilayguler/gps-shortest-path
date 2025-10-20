const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  warehouse_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  driver_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Assigned driver (user with driver role)'
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'User who created the order'
  },
  delivery_address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  delivery_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  delivery_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'assigned', 'in_transit', 'delivered', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
  },
  estimated_delivery: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  actual_delivery: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  delivery_group_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'UUID for grouping orders in the same delivery batch'
  },
  delivery_group_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Display name for the delivery group (e.g., "Delivery 1")'
  }
}, {
  tableName: 'orders',   
  timestamps: true,    
  underscored: true,
  paranoid: true
});

module.exports = Order;
