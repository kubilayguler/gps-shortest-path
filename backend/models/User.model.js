const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Company user belongs to (null for admin)'
  },
  warehouse_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Warehouse user belongs to (for employees and drivers)'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'users',   
  timestamps: true,    
  underscored: true,
  paranoid: true
});

module.exports = User;
