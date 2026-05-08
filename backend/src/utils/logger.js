import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? {
        // 生产环境：输出 JSON 到 stdout，供日志聚合系统消费
        formatters: {
          level(label) {
            return { level: label }
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }
    : {
        // 开发环境：可读的彩色输出
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
})

export default logger
