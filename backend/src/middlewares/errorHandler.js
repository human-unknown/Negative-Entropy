import { error } from '../utils/response.js'
import logger from '../utils/logger.js'

export const errorHandler = (err, req, res, next) => {
  logger.error({ err, path: req.path, method: req.method }, '请求处理错误')

  if (res.headersSent) {
    return next(err)
  }

  let statusCode = err.statusCode || 500
  let message = err.message || '服务器内部错误'

  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    statusCode = 408
    message = '请求超时，请稍后重试'
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503
    message = '服务暂时不可用'
  } else if (err.code === 'ER_LOCK_WAIT_TIMEOUT') {
    statusCode = 409
    message = '操作繁忙，请稍后重试'
  } else if (err.code === 'ER_LOCK_DEADLOCK') {
    statusCode = 409
    message = '操作冲突，请重试'
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 400
    message = '数据已存在，请勿重复提交'
  } else if (err.name === 'ValidationError') {
    statusCode = 400
    message = '参数验证失败'
  }

  res.status(statusCode).json(error(message, statusCode))
}

export const timeoutMiddleware = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout, () => {
      const err = new Error('请求超时')
      err.code = 'ETIMEDOUT'
      err.statusCode = 408
      next(err)
    })

    res.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(408).json(error('响应超时，请稍后重试', 408))
      }
    })

    next()
  }
}
