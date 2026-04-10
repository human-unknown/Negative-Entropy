import mysql from 'mysql2/promise'
import config from './app.js'

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 30000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
})

pool.on('connection', (connection) => {
  connection.on('error', (err) => {
    console.error('数据库连接错误:', err)
  })
})

export default pool
