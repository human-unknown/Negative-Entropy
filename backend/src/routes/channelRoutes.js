import express from 'express'
import { getChannels, createChannel } from '../controllers/channelController.js'
import { auth } from '../middlewares/auth.js'
import { requireAdmin } from '../middlewares/permission.js'

const router = express.Router()

router.get('/', getChannels)
router.post('/', auth, requireAdmin, createChannel)

export default router
