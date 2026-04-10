// 辩论状态
export const DEBATE_STATUS = {
  DRAFT: 0,      // 草稿
  ACTIVE: 1,     // 进行中
  CLOSED: 2,     // 已结束
  ARCHIVED: 3    // 已归档
}

export const DEBATE_STATUS_TEXT = {
  [DEBATE_STATUS.DRAFT]: '草稿',
  [DEBATE_STATUS.ACTIVE]: '进行中',
  [DEBATE_STATUS.CLOSED]: '已结束',
  [DEBATE_STATUS.ARCHIVED]: '已归档'
}
