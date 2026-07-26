import sql from 'mssql';

let poolPromise;
const config = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT || 15000),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 5000 }
};

export function getPool() {
  if (!poolPromise) poolPromise = sql.connect(config);
  return poolPromise;
}
export { sql };
