import express from 'express'
import {
  sendResetCode,
  resetPassword,
  enable2FA,
  send2FACode,
  verify2FA,
} from '../controllers/securityController.js'

const router = express.Router()

router.post('/send-reset-code', sendResetCode)
router.post('/reset-password', resetPassword)
router.post('/2fa/enable', enable2FA)
router.post('/2fa/send-code', send2FACode)
router.post('/2fa/verify', verify2FA)

export default router
