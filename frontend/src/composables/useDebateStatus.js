import { computed } from 'vue'
import { DEBATE_STATUS } from '@/constants/debateStatus'

export const useDebateStatus = (topic) => {
  // 辩论状态
  const status = computed(() => topic.value?.status)

  // 是否未开始
  const isNotStarted = computed(() => status.value === DEBATE_STATUS.DRAFT)

  // 是否进行中
  const isActive = computed(() => status.value === DEBATE_STATUS.ACTIVE)

  // 是否已结束（投票中）
  const isClosed = computed(() => status.value === DEBATE_STATUS.CLOSED)

  // 是否已归档
  const isArchived = computed(() => status.value === DEBATE_STATUS.ARCHIVED)

  // 是否可以发言
  const canSpeak = computed(() => isActive.value)

  // 是否可以投票
  const canVote = computed(() => isClosed.value)

  // 是否可以加入
  const canJoin = computed(() => isActive.value)

  // 是否显示结果
  const showResult = computed(() => isArchived.value)

  // 获取状态提示文本
  const getStatusTip = (action) => {
    if (isNotStarted.value) {
      return '辩论尚未开始'
    }
    if (isActive.value) {
      if (action === 'vote') return '辩论进行中，暂不能投票'
      return ''
    }
    if (isClosed.value) {
      if (action === 'speak') return '辩论已结束，不能发言'
      return ''
    }
    if (isArchived.value) {
      if (action === 'speak') return '辩论已归档，不能发言'
      if (action === 'vote') return '辩论已归档，不能投票'
      return ''
    }
    return ''
  }

  // 获取状态文本
  const statusText = computed(() => {
    if (isNotStarted.value) return '未开始'
    if (isActive.value) return '进行中'
    if (isClosed.value) return '投票中'
    if (isArchived.value) return '已结束'
    return '未知'
  })

  // 获取状态颜色类
  const statusClass = computed(() => {
    if (isNotStarted.value) return 'draft'
    if (isActive.value) return 'active'
    if (isClosed.value) return 'voting'
    if (isArchived.value) return 'ended'
    return ''
  })

  return {
    status,
    isNotStarted,
    isActive,
    isClosed,
    isArchived,
    canSpeak,
    canVote,
    canJoin,
    showResult,
    getStatusTip,
    statusText,
    statusClass
  }
}
