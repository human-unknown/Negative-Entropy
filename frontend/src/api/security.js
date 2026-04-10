import request from './request'

export const sendResetCode = (account) => {
  return request.post('/security/send-reset-code', { account })
}

export const resetPassword = (account, code, newPassword) => {
  return request.post('/security/reset-password', { account, code, newPassword })
}

export const enable2FA = (userId, enable) => {
  return request.post('/security/2fa/enable', { userId, enable })
}

export const send2FACode = (userId) => {
  return request.post('/security/2fa/send-code', { userId })
}

export const verify2FA = (userId, code) => {
  return request.post('/security/2fa/verify', { userId, code })
}
