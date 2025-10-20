const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 4
    },
    comment: 'Permission priority: 1=highest (admin), 4=lowest (driver)'
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'roles',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['priority']
    }
  ]
});

// Default roles configuration
Role.DEFAULT_ROLES = {
  ADMIN: { id: 1, name: 'Admin', priority: 1, description: 'Full system access' },
  MANAGER: { id: 2, name: 'Manager', priority: 2, description: 'Manage company, warehouses, users, orders' },
  EMPLOYEE: { id: 3, name: 'Employee', priority: 3, description: 'Create and manage orders' },
  DRIVER: { id: 4, name: 'Driver', priority: 4, description: 'View assigned orders and calculate routes' }
};

module.exports = Role;
