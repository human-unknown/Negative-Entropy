import app from './src/app.js'
import config from './src/config/app.js'

app.listen(config.port, () => {
  console.log(`服务器运行在 http://localhost:${config.port}`)
})
