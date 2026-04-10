import { ElMessage, ElMessageBox } from 'element-plus'

export const message = {
  success: (msg) => ElMessage.success(msg),
  error: (msg) => ElMessage.error(msg),
  warning: (msg) => ElMessage.warning(msg),
  info: (msg) => ElMessage.info(msg)
}

export const showMessage = message

export const confirm = (msg, title = '确认') =>
  ElMessageBox.confirm(msg, title, { type: 'warning' })
