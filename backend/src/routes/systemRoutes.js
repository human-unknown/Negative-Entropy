import { Router } from 'express'
import { shutdown } from '../controllers/systemController.js'

const router = Router()

// 关闭后端服务（仅本地调试）
router.post('/shutdown', shutdown)

export default router
