import express from 'express'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notificationController.js'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.get('/', auth, getNotifications)
router.get('/unread-count', auth, getUnreadCount)
router.put('/:id/read', auth, markAsRead)
router.put('/read-all', auth, markAllAsRead)

export default router
