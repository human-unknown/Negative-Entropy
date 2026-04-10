/**
 * 内容防护组合式函数
 * 禁止复制、右键、打印、截图
 */
import { onMounted, onUnmounted } from 'vue'

export const useContentProtection = () => {
  // 禁止复制
  const preventCopy = (e) => {
    e.preventDefault()
    alert('禁止复制站内内容')
    return false
  }

  // 禁止右键
  const preventContextMenu = (e) => {
    e.preventDefault()
    alert('禁止使用右键菜单')
    return false
  }

  // 禁止选择文本
  const preventSelect = (e) => {
    e.preventDefault()
    return false
  }

  // 禁止拖拽
  const preventDrag = (e) => {
    e.preventDefault()
    return false
  }

  // 禁止打印和截图快捷键
  const preventKeyboard = (e) => {
    // Ctrl+P / Cmd+P (打印)
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault()
      alert('禁止打印')
      return false
    }
    
    // PrintScreen / Cmd+Shift+3/4 (截图)
    if (e.key === 'PrintScreen' || 
        ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '3' || e.key === '4'))) {
      alert('禁止截图')
    }

    // Ctrl+S / Cmd+S (保存)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      alert('禁止保存页面')
      return false
    }

    // F12 (开发者工具)
    if (e.key === 'F12') {
      e.preventDefault()
      return false
    }
  }

  // 启用防护
  const enableProtection = () => {
    document.addEventListener('copy', preventCopy)
    document.addEventListener('cut', preventCopy)
    document.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('selectstart', preventSelect)
    document.addEventListener('dragstart', preventDrag)
    document.addEventListener('keydown', preventKeyboard)
    
    // 添加CSS防选择
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
  }

  // 禁用防护
  const disableProtection = () => {
    document.removeEventListener('copy', preventCopy)
    document.removeEventListener('cut', preventCopy)
    document.removeEventListener('contextmenu', preventContextMenu)
    document.removeEventListener('selectstart', preventSelect)
    document.removeEventListener('dragstart', preventDrag)
    document.removeEventListener('keydown', preventKeyboard)
    
    // 恢复CSS
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''
  }

  // 组件挂载时启用
  onMounted(() => {
    enableProtection()
  })

  // 组件卸载时禁用
  onUnmounted(() => {
    disableProtection()
  })

  return {
    enableProtection,
    disableProtection
  }
}
