import app from './src/app.js'
import config from './src/config/app.js'

const PORT = config.port || 5000

app.listen(PORT, () => {
  console.log(`服务已启动: http://localhost:${PORT}`)
  console.log(`健康检查: http://localhost:${PORT}/health`)
})
