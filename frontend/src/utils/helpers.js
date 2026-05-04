import { ElMessage } from 'element-plus'

export const handleResponse = (promise, successMsg) => {
  return promise
    .then(data => {
      if (successMsg) ElMessage.success(successMsg)
      return [data, null]
    })
    .catch(error => [null, error])
}

export const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN', { hour12: false })
}

export const debounce = (fn, delay = 300) => {
  let timer
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}
