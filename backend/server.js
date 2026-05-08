import app from './src/app.js'
import config from './src/config/app.js'
import logger from './src/utils/logger.js'

const PORT = config.port || 5000

app.listen(PORT, () => {
  logger.info({ port: PORT }, '服务已启动')
  logger.info({ health: `http://localhost:${PORT}/health` }, '健康检查端点就绪')
})
