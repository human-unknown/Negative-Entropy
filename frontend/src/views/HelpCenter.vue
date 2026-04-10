<template>
  <div class="help-center">
    <div class="help-header">
      <h1>帮助中心</h1>
      <p>欢迎来到逆熵辩论平台</p>
    </div>

    <div class="help-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['nav-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="help-content">
      <section v-show="activeTab === 'rules'" class="section">
        <h2>📋 规则详解</h2>
        
        <div class="rule-item">
          <h3>用户等级制度</h3>
          <ul>
            <li><strong>普通用户（1级）</strong>：可参与辩论、发言、投票</li>
            <li><strong>资深用户（2级）</strong>：可发布话题、参与规则辩论</li>
            <li><strong>专家用户（3级）</strong>：拥有更高权限和影响力</li>
            <li><strong>管理员（4级）</strong>：负责内容审核和平台管理</li>
          </ul>
        </div>

        <div class="rule-item">
          <h3>经验值获取</h3>
          <ul>
            <li>发布话题：+50 经验</li>
            <li>参与辩论：+20 经验</li>
            <li>发表发言：+10 经验</li>
            <li>辩论获胜：+30 经验</li>
            <li>每日登录：+5 经验</li>
          </ul>
        </div>

        <div class="rule-item">
          <h3>违规处理</h3>
          <ul>
            <li>轻微违规：警告，扣除10经验</li>
            <li>一般违规：禁言1-7天，扣除50经验</li>
            <li>严重违规：封禁账号，清空经验</li>
          </ul>
        </div>
      </section>

      <section v-show="activeTab === 'guide'" class="section">
        <h2>🚀 入站指南</h2>
        
        <div class="guide-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>注册账号</h3>
            <p>使用手机号或邮箱注册，设置用户名和密码。用户名需符合规范，不得包含敏感词汇。</p>
          </div>
        </div>

        <div class="guide-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>浏览话题</h3>
            <p>在首页浏览热门话题，可按分类、热度、时间筛选。点击话题查看详情和辩论内容。</p>
          </div>
        </div>

        <div class="guide-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>加入辩论</h3>
            <p>选择正方或反方立场加入辩论。注意人数限制，先到先得。</p>
          </div>
        </div>

        <div class="guide-step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h3>发表观点</h3>
            <p>在辩论进行中发表发言，字数限制10-500字。发言需通过AI和人工审核。</p>
          </div>
        </div>

        <div class="guide-step">
          <div class="step-number">5</div>
          <div class="step-content">
            <h3>投票评判</h3>
            <p>辩论结束后，所有用户可投票选择获胜方。投票结果决定辩论胜负。</p>
          </div>
        </div>
      </section>

      <section v-show="activeTab === 'process'" class="section">
        <h2>🔄 辩论流程</h2>
        
        <div class="process-timeline">
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <h3>话题发布</h3>
              <p>资深用户发布辩论话题，设置正反方人数上限，等待审核通过。</p>
            </div>
          </div>

          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <h3>用户加入</h3>
              <p>用户选择立场加入辩论，正反方人数达到要求后，辩论自动开始。</p>
            </div>
          </div>

          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <h3>辩论进行</h3>
              <p>辩手发表观点，观众可旁观并发表评论。发言有冷却时间限制（60秒）。</p>
            </div>
          </div>

          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <h3>辩论结束</h3>
              <p>发布者可手动结束辩论，或达到时间/发言数限制后自动结束。</p>
            </div>
          </div>

          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <h3>投票阶段</h3>
              <p>所有用户可投票选择获胜方，每人仅可投一票。</p>
            </div>
          </div>

          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <h3>结果公布</h3>
              <p>发布者结算辩论，系统统计票数，公布获胜方，发放经验奖励。</p>
            </div>
          </div>
        </div>
      </section>

      <section v-show="activeTab === 'faq'" class="section">
        <h2>❓ 常见问题</h2>
        
        <div class="faq-item">
          <h3>Q: 如何提升用户等级？</h3>
          <p>A: 通过积累经验值提升等级。多参与辩论、发表高质量发言、赢得辩论可快速获取经验。</p>
        </div>

        <div class="faq-item">
          <h3>Q: 发言为什么被驳回？</h3>
          <p>A: 可能包含违规内容（人身攻击、敏感词汇、广告等）。请遵守社区规范，文明辩论。</p>
        </div>

        <div class="faq-item">
          <h3>Q: 可以修改已发表的发言吗？</h3>
          <p>A: 不可以。为保证辩论公平性，发言一经发布不可修改。请谨慎发言。</p>
        </div>

        <div class="faq-item">
          <h3>Q: 如何举报违规内容？</h3>
          <p>A: 点击发言右上角的举报按钮，选择违规类型并提交。管理员会及时处理。</p>
        </div>

        <div class="faq-item">
          <h3>Q: 辩论人数已满怎么办？</h3>
          <p>A: 可以观众身份参与，发表评论支持某一方。或等待新话题发布。</p>
        </div>

        <div class="faq-item">
          <h3>Q: 忘记密码怎么办？</h3>
          <p>A: 点击登录页面的"忘记密码"，通过手机号或邮箱验证后重置密码。</p>
        </div>

        <div class="faq-item">
          <h3>Q: 如何参与规则辩论？</h3>
          <p>A: 达到资深用户等级后，可在规则辩论区提出或参与平台规则的讨论和投票。</p>
        </div>

        <div class="faq-item">
          <h3>Q: 被封禁后如何申诉？</h3>
          <p>A: 联系管理员邮箱提交申诉，说明情况。管理员会在3个工作日内回复。</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeTab = ref('rules')

const tabs = [
  { id: 'rules', label: '规则详解' },
  { id: 'guide', label: '入站指南' },
  { id: 'process', label: '辩论流程' },
  { id: 'faq', label: 'FAQ' }
]
</script>

<style scoped>
.help-center {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.help-header {
  text-align: center;
  margin-bottom: 40px;
}

.help-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
}

.help-header p {
  font-size: 16px;
  color: #666;
}

.help-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid #f0f0f0;
}

.nav-btn {
  padding: 12px 24px;
  border: none;
  background: none;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  position: relative;
  transition: color 0.3s;
}

.nav-btn:hover {
  color: #1890ff;
}

.nav-btn.active {
  color: #1890ff;
  font-weight: 500;
}

.nav-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #1890ff;
}

.help-content {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 24px;
}

.rule-item {
  margin-bottom: 24px;
}

.rule-item h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
}

.rule-item ul {
  list-style: none;
  padding: 0;
}

.rule-item li {
  padding: 8px 0;
  color: #666;
  line-height: 1.6;
}

.rule-item li::before {
  content: '•';
  color: #1890ff;
  font-weight: bold;
  margin-right: 8px;
}

.guide-step {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.step-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: #1890ff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
}

.step-content h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
}

.step-content p {
  color: #666;
  line-height: 1.6;
}

.process-timeline {
  position: relative;
  padding-left: 30px;
}

.process-timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #e8e8e8;
}

.timeline-item {
  position: relative;
  margin-bottom: 30px;
}

.timeline-dot {
  position: absolute;
  left: -26px;
  top: 4px;
  width: 16px;
  height: 16px;
  background: #1890ff;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #1890ff;
}

.timeline-content h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
}

.timeline-content p {
  color: #666;
  line-height: 1.6;
}

.faq-item {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.faq-item h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.faq-item p {
  color: #666;
  line-height: 1.6;
}
</style>
