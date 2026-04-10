import express from 'express'
import { validateName, addExp, updatePhone, updateEmail, getUserDebates } from '../controllers/userController.js'
import { auth } from '../middlewares/auth.js'
import { requireAdmin } from '../middlewares/permission.js'

const router = express.Router()

router.post('/validate-name', validateName)
router.post('/add-exp', auth, requireAdmin, addExp)
router.post('/phone', auth, updatePhone)
router.post('/email', auth, updateEmail)
router.get('/debates', auth, getUserDebates)

export default router
