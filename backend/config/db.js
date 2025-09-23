const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(
process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  }
);
sequelize.sync({ alter: true })
  .then(() => console.log("DB synced"))
  .catch(err => console.error("Sync error:", err));

module.exports = sequelize;
