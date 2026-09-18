require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config)
      .then((pool) => {
        console.log('Conectado a SQL Server:', process.env.DB_DATABASE);
        return pool;
      })
      .catch((err) => {
        poolPromise = null;
        console.error('Error de conexion a SQL Server:', err.message);
        throw err;
      });
  }
  return poolPromise;
}

module.exports = { sql, getPool };
