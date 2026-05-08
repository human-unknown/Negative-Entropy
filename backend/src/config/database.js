import mysql from 'mysql2/promise'
import config from './app.js'
import logger from '../utils/logger.js'

// mysql2 v3 不再支持 acquireTimeout 和 timeout 作为连接选项
const poolConfig = {
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
}

const pool = mysql.createPool(poolConfig)

// 测试连接（不阻塞启动）
pool
  .getConnection()
  .then((conn) => {
    conn.release()
    logger.info('数据库连接成功')
  })
  .catch((err) => {
    logger.warn({ err: err.message }, '数据库暂不可用，API 将返回降级响应')
  })

export default pool
