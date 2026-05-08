import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    if (times > 10) {
      console.warn('Redis 连接失败，已重试 10 次，放弃重连')
      return null
    }
    return Math.min(times * 200, 3000)
  },
  lazyConnect: true,
})

// 异步连接，不阻塞启动
redis
  .connect()
  .then(() => {
    console.log('Redis 连接成功')
  })
  .catch((err) => {
    console.warn('Redis 暂不可用，验证码将使用内存存储:', err.message)
  })

export default redis

// ---- 验证码辅助函数 ----

const CODE_PREFIX_RESET = 'vcode:reset:'
const CODE_PREFIX_2FA = 'vcode:2fa:'

/** 存储验证码（自动 TTL），Redis 不可用时回退内存 */
const fallbackMap = new Map()

export async function setVerificationCode(key, code, ttlSeconds = 600) {
  try {
    if (redis.status === 'ready') {
      await redis.set(key, code, 'EX', ttlSeconds)
      return
    }
  } catch {
    // 降级到内存
  }
  fallbackMap.set(key, { code, expires: Date.now() + ttlSeconds * 1000 })
}

export async function getVerificationCode(key) {
  try {
    if (redis.status === 'ready') {
      return await redis.get(key)
    }
  } catch {
    // 降级到内存
  }
  const entry = fallbackMap.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    fallbackMap.delete(key)
    return null
  }
  return entry.code
}

export async function deleteVerificationCode(key) {
  try {
    if (redis.status === 'ready') {
      await redis.del(key)
      return
    }
  } catch {
    // 降级到内存
  }
  fallbackMap.delete(key)
}

export { CODE_PREFIX_RESET, CODE_PREFIX_2FA }
