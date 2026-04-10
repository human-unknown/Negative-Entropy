/**
 * 违规类型枚举
 */
export const ViolationType = {
  EMOTIONAL: 'emotional',           // 情绪化
  INSULT: 'insult',                 // 侮辱
  DISCRIMINATION: 'discrimination', // 歧视
  INCITEMENT: 'incitement',         // 煽动
  PERSONAL_ATTACK: 'personal_attack', // 人身攻击
  LABELING: 'labeling',             // 标签化
  MEANINGLESS: 'meaningless'        // 无意义内容
}

/**
 * 违规类型描述
 */
export const ViolationTypeDesc = {
  [ViolationType.EMOTIONAL]: '情绪化',
  [ViolationType.INSULT]: '侮辱',
  [ViolationType.DISCRIMINATION]: '歧视',
  [ViolationType.INCITEMENT]: '煽动',
  [ViolationType.PERSONAL_ATTACK]: '人身攻击',
  [ViolationType.LABELING]: '标签化',
  [ViolationType.MEANINGLESS]: '无意义内容'
}

/**
 * 违规严重程度
 */
export const ViolationSeverity = {
  LOW: 'low',       // 轻微
  MEDIUM: 'medium', // 中等
  HIGH: 'high',     // 严重
  CRITICAL: 'critical' // 极其严重
}

/**
 * 违规类型对应的严重程度
 */
export const ViolationSeverityMap = {
  [ViolationType.EMOTIONAL]: ViolationSeverity.LOW,
  [ViolationType.MEANINGLESS]: ViolationSeverity.LOW,
  [ViolationType.LABELING]: ViolationSeverity.MEDIUM,
  [ViolationType.INSULT]: ViolationSeverity.MEDIUM,
  [ViolationType.DISCRIMINATION]: ViolationSeverity.HIGH,
  [ViolationType.INCITEMENT]: ViolationSeverity.HIGH,
  [ViolationType.PERSONAL_ATTACK]: ViolationSeverity.HIGH
}

export default ViolationType
