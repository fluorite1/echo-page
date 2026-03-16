import { ElMessage } from 'element-plus'

export default function toast(
  message = '',
  type: 'success' | 'warning' | 'error' | 'info' = 'error',
  duration = 1500
): void {
  ElMessage({
    message,
    type,
    duration,
  })
}
