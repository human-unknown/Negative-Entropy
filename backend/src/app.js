import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
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
import reviewRoutes from './routes/reviewRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import auditRoutes from './routes/auditRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import systemRoutes from './routes/systemRoutes.js'
import templateRoutes from './routes/templateRoutes.js'
import scoreRoutes from './routes/scoreRoutes.js'
import channelRoutes from './routes/channelRoutes.js'
import postRoutes from './routes/postRoutes.js'
import commentRoutes, { commentActionRouter } from './routes/commentRoutes.js'
import { aiAuditService } from './services/aiAuditService.js'

const app = express()

// 初始化 AI 审核服务
aiAuditService.init()

// ---- 安全中间件 ----

// 安全响应头 — CSP 允许 Vue 生产构建的内联脚本
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  }),
)

// CORS — 生产环境白名单，开发环境宽松
const corsOrigin =
  process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN || 'https://your-production-domain.com'
    : 'http://localhost:5173'

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
)

// ---- 速率限制 ----

const isProduction = process.env.NODE_ENV === 'production'

// 全局限流：开发环境宽松，生产环境严格
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
})

// 敏感端点限流：15 分钟内最多 10 次（登录/注册/验证码等）
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '操作过于频繁，请15分钟后再试' },
})

app.use('/api/', globalLimiter)
app.use('/api/auth', authLimiter)
app.use('/api/security', authLimiter)

// ---- 解析中间件 ----

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(timeoutMiddleware(30000))

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' })
})

// 深度健康检查
app.get('/health/deep', async (req, res) => {
  try {
    const pool = (await import('./config/database.js')).default
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' })
  }
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
app.use('/api/review', reviewRoutes)
app.use('/api/report', reportRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/notification', notificationRoutes)
app.use('/api/system', systemRoutes)
app.use('/api/debate/templates', templateRoutes)
app.use('/api/debate', scoreRoutes)

// 社区功能（帖子 + 评论 + 频道）
app.use('/api/channels', channelRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/posts/:postId/comments', commentRoutes)
app.use('/api/comments', commentActionRouter)

// ---- 开发环境：托管前端静态文件 ----
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../../frontend/dist')
app.use(express.static(distPath))
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// 错误处理
app.use(errorHandler)

export default app
