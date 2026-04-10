// 经验值获取规则
export const EXP_RULES = {
  DEBATE_WIN: 100,           // 辩论胜利
  DEBATE_LOSE: 30,           // 辩论失败
  AUDIENCE_COMMENT: 5,       // 观众合规发言
  DEBATE_PARTICIPATE: 20     // 规则辩论参与
}

// 经验值规则说明
export const EXP_RULES_TEXT = {
  [EXP_RULES.DEBATE_WIN]: '辩论胜利',
  [EXP_RULES.DEBATE_LOSE]: '辩论失败',
  [EXP_RULES.AUDIENCE_COMMENT]: '观众合规发言',
  [EXP_RULES.DEBATE_PARTICIPATE]: '规则辩论参与'
}
