<template>
  <div class="level-guide">
    <h1>等级系统说明</h1>
    
    <section class="section">
      <h2>等级列表</h2>
      <div class="level-list">
        <div class="level-item" v-for="level in levels" :key="level.value">
          <div class="level-header">
            <span class="level-name">{{ level.name }}</span>
            <span class="level-exp">{{ level.exp }} 经验</span>
          </div>
          <div class="level-permissions">
            <span class="permission-label">权限：</span>
            <span>{{ level.permissions }}</span>
          </div>
        </div>
      </div>
    </section>
    
    <section class="section">
      <h2>经验获取规则</h2>
      <div class="exp-rules">
        <div class="rule-item" v-for="rule in expRules" :key="rule.name">
          <span class="rule-name">{{ rule.name }}</span>
          <span class="rule-exp">+{{ rule.exp }} 经验</span>
        </div>
      </div>
    </section>
    
    <section class="section">
      <h2>升级说明</h2>
      <p>经验值达到对应等级阈值后自动升级，解锁相应权限。</p>
    </section>
  </div>
</template>

<script setup>
import { USER_LEVEL_TEXT } from '../constants/userLevel.js'
import { LEVEL_THRESHOLDS } from '../constants/levelThresholds.js'
import { EXP_RULES, EXP_RULES_TEXT } from '../constants/expRules.js'

const levels = [
  { value: 1, name: USER_LEVEL_TEXT[1], exp: LEVEL_THRESHOLDS[1], permissions: '参与辩论' },
  { value: 2, name: USER_LEVEL_TEXT[2], exp: LEVEL_THRESHOLDS[2], permissions: '参与辩论' },
  { value: 3, name: USER_LEVEL_TEXT[3], exp: LEVEL_THRESHOLDS[3], permissions: '参与辩论、发布话题' },
  { value: 4, name: USER_LEVEL_TEXT[4], exp: LEVEL_THRESHOLDS[4], permissions: '全部权限' }
]

const expRules = [
  { name: EXP_RULES_TEXT[EXP_RULES.DEBATE_WIN], exp: EXP_RULES.DEBATE_WIN },
  { name: EXP_RULES_TEXT[EXP_RULES.DEBATE_LOSE], exp: EXP_RULES.DEBATE_LOSE },
  { name: EXP_RULES_TEXT[EXP_RULES.DEBATE_PARTICIPATE], exp: EXP_RULES.DEBATE_PARTICIPATE },
  { name: EXP_RULES_TEXT[EXP_RULES.AUDIENCE_COMMENT], exp: EXP_RULES.AUDIENCE_COMMENT }
]
</script>

<style scoped>
.level-guide {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 32px;
  text-align: center;
}

.section {
  margin-bottom: 32px;
}

h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.level-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.level-item {
  padding: 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.level-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.level-exp {
  font-size: 14px;
  color: #666;
}

.level-permissions {
  font-size: 14px;
  color: #666;
}

.permission-label {
  font-weight: 500;
  color: #333;
}

.exp-rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.rule-name {
  font-size: 14px;
  color: #333;
}

.rule-exp {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.section p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}
</style>
