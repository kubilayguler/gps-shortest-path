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

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected!');
    // sync removed - use migrations or seed script instead
    console.log('Database ready!');
  } catch (err) {
    console.error('DB connection error:', err);
  }
})();

module.exports = sequelize;
