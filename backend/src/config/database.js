const sql = require('mssql');

const config = {
  user: process.env.DB_USER || 'your_username',
  password: process.env.DB_PASSWORD || 'your_password',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'PurchaseSystem',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

let pool;

const connectDB = async () => {
  try {
    pool = await sql.connect(config);
    console.log('Connected to MSSQL database');
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database not connected');
  }
  return pool;
};

module.exports = { connectDB, getPool, sql };