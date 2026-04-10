import express from 'express'
import cors from 'cors'
import config from './config/app.js'
import { errorHandler, timeoutMiddleware } from './middlewares/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import checkRoutes from './routes/checkRoutes.js'
import securityRoutes from './routes/securityRoutes.js'
import debateRoutes from './routes/debateRoutes.js'
import ruleDebateRoutes from './routes/ruleDebateRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import feedbackRoutes from './routes/feedbackRoutes.js'
import appealRoutes from './routes/appealRoutes.js'

const app = express()

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(timeoutMiddleware(30000))

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' })
})

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/check', checkRoutes)
app.use('/api/security', securityRoutes)
app.use('/api/debate', debateRoutes)
app.use('/api/rule-debate', ruleDebateRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/appeal', appealRoutes)

// 错误处理
app.use(errorHandler)

export default app
