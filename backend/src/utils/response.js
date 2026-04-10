export const success = (data = null, message = '成功') => ({
  code: 200,
  message,
  data
})

export const error = (message = '失败', code = 500) => ({
  code,
  message,
  data: null
})
