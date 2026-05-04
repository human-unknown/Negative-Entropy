import express from 'express'
import { getTemplates, getTemplateDetail, createTemplate } from '../controllers/templateController.js'
import { auth } from '../middlewares/auth.js'
import { requireAdmin } from '../middlewares/permission.js'

const router = express.Router()

router.get('/', getTemplates)
router.get('/:id', getTemplateDetail)
router.post('/', auth, requireAdmin, createTemplate)

export default router
