// 防抖
export const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 节流
export const throttle = (fn, delay = 300) => {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= delay) {
      last = now
      fn.apply(this, args)
    }
  }
}

// 懒加载
export const lazyLoad = (callback) => {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) callback(entry.target)
      })
    })
  }
  return null
}

// 错误重试
export const retry = async (fn, times = 3, delay = 1000) => {
  for (let i = 0; i < times; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === times - 1) throw err
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
