// 后端关闭端点（仅本地调试用）
export const shutdown = (req, res) => {
  console.log('收到关闭请求，正在停止服务器...')
  res.json({ code: 200, message: '服务器正在关闭' })
  
  // 延迟返回后触发关闭
  setTimeout(() => {
    process.kill(process.pid, 'SIGTERM')
  }, 200)
}
