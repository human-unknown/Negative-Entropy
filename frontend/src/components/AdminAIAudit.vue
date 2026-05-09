<template>
  <div class="ai-audit-admin">
    <!-- 子标签导航 -->
    <div class="sub-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['sub-tab', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- ═══════════ 审核统计 ═══════════ -->
    <section v-if="activeTab === 'stats'">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">总审核数</div>
        </div>
        <div class="stat-card pass">
          <div class="stat-number">{{ stats.pass }}</div>
          <div class="stat-label">通过</div>
        </div>
        <div class="stat-card warn">
          <div class="stat-number">{{ stats.manual_review }}</div>
          <div class="stat-label">待复核</div>
        </div>
        <div class="stat-card reject">
          <div class="stat-number">{{ stats.reject }}</div>
          <div class="stat-label">拒绝</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.avgElapsedMs }}ms</div>
          <div class="stat-label">平均耗时</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ formatTokens(stats.totalPromptTokens + stats.totalCompletionTokens) }}</div>
          <div class="stat-label">Token用量</div>
        </div>
      </div>
      <div class="stat-controls">
        <label>统计天数：</label>
        <select v-model="statsDays" @change="loadStats">
          <option :value="1">今天</option>
          <option :value="3">近3天</option>
          <option :value="7">近7天</option>
          <option :value="30">近30天</option>
        </select>
      </div>
    </section>

    <!-- ═══════════ 审核配置 ═══════════ -->
    <section v-if="activeTab === 'config'" class="config-section">
      <div class="section-card">
        <h3>AI审核开关</h3>
        <div class="config-row">
          <span class="config-label">启用AI审核</span>
          <label class="switch">
            <input v-model="config.audit_enabled" type="checkbox" true-value="true" false-value="false" />
            <span class="slider"></span>
          </label>
        </div>

        <h3 style="margin-top: 24px;">审核阈值</h3>
        <div class="config-row">
          <span class="config-label">拒绝阈值</span>
          <input v-model="config.confidence_threshold_reject" type="number" step="0.01" min="0" max="1" class="config-input" />
          <span class="config-hint">confidence >= 此值直接拒绝</span>
        </div>
        <div class="config-row">
          <span class="config-label">人工复核阈值</span>
          <input v-model="config.confidence_threshold_manual" type="number" step="0.01" min="0" max="1" class="config-input" />
          <span class="config-hint">confidence 低于此值人工复核</span>
        </div>

        <h3 style="margin-top: 24px;">内容长度限制</h3>
        <div class="config-row">
          <span class="config-label">话题最大长度</span>
          <input v-model="config.max_content_length_topic" type="number" class="config-input" />
        </div>
        <div class="config-row">
          <span class="config-label">发言最大长度</span>
          <input v-model="config.max_content_length_speech" type="number" class="config-input" />
        </div>
        <div class="config-row">
          <span class="config-label">评论最大长度</span>
          <input v-model="config.max_content_length_comment" type="number" class="config-input" />
        </div>
        <div class="config-row">
          <span class="config-label">帖子最大长度</span>
          <input v-model="config.max_content_length_post" type="number" class="config-input" />
        </div>

        <div class="config-actions">
          <button class="btn-save" @click="saveConfig">保存配置</button>
        </div>
      </div>
    </section>

    <!-- ═══════════ 敏感词管理 ═══════════ -->
    <section v-if="activeTab === 'words'" class="words-section">
      <div class="section-card">
        <div class="words-toolbar">
          <div class="words-add">
            <input v-model="newWord.word" placeholder="输入敏感词..." class="input-word" @keyup.enter="handleAddWord" />
            <select v-model="newWord.level" class="select-level">
              <option value="blocked">直接拒绝</option>
              <option value="suspicious">疑似</option>
            </select>
            <select v-model="newWord.category" class="select-cat">
              <option value="">无分类</option>
              <option value="人身攻击">人身攻击</option>
              <option value="色情">色情</option>
              <option value="广告">广告</option>
              <option value="政治">政治</option>
              <option value="灌水">灌水</option>
              <option value="其他">其他</option>
            </select>
            <button class="btn-add" @click="handleAddWord">添加</button>
          </div>
          <div class="words-filters">
            <select v-model="wordFilter.level" @change="loadWords">
              <option value="">全部级别</option>
              <option value="blocked">直接拒绝</option>
              <option value="suspicious">疑似</option>
            </select>
            <select v-model="wordFilter.category" @change="loadWords">
              <option value="">全部分类</option>
              <option value="人身攻击">人身攻击</option>
              <option value="色情">色情</option>
              <option value="广告">广告</option>
              <option value="政治">政治</option>
              <option value="灌水">灌水</option>
            </select>
          </div>
        </div>

        <table class="words-table">
          <thead>
            <tr>
              <th>敏感词</th>
              <th>级别</th>
              <th>分类</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="words.length === 0">
              <td colspan="5" class="empty-cell">暂无敏感词</td>
            </tr>
            <tr v-for="w in words" :key="w.id">
              <td>{{ w.word }}</td>
              <td>
                <span :class="['badge', w.level === 'blocked' ? 'badge-danger' : 'badge-warn']">
                  {{ w.level === 'blocked' ? '拒绝' : '疑似' }}
                </span>
              </td>
              <td>{{ w.category || '-' }}</td>
              <td>
                <span :class="['badge', w.is_active ? 'badge-success' : 'badge-gray']">
                  {{ w.is_active ? '启用' : '禁用' }}
                </span>
              </td>
              <td>
                <button class="btn-sm" @click="toggleWord(w)">{{ w.is_active ? '禁用' : '启用' }}</button>
                <button class="btn-sm btn-danger" @click="handleDeleteWord(w.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ═══════════ 审核日志 ═══════════ -->
    <section v-if="activeTab === 'logs'" class="logs-section">
      <div class="section-card">
        <div class="log-filters">
          <select v-model="logFilter.verdict" @change="loadLogs">
            <option value="">全部结果</option>
            <option value="pass">通过</option>
            <option value="manual_review">待复核</option>
            <option value="reject">拒绝</option>
          </select>
          <select v-model="logFilter.content_type" @change="loadLogs">
            <option value="">全部类型</option>
            <option value="topic">话题</option>
            <option value="speech">发言</option>
            <option value="username">用户名</option>
            <option value="post_title">帖子标题</option>
            <option value="post_content">帖子正文</option>
            <option value="comment">评论</option>
          </select>
        </div>

        <table class="logs-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>结果</th>
              <th>原因</th>
              <th>置信度</th>
              <th>耗时</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="logs.length === 0">
              <td colspan="6" class="empty-cell">暂无审核日志</td>
            </tr>
            <tr v-for="l in logs" :key="l.id">
              <td>{{ formatDate(l.created_at) }}</td>
              <td>{{ typeLabel(l.content_type) }}</td>
              <td>
                <span :class="['badge', verdictBadge(l.verdict)]">
                  {{ verdictLabel(l.verdict) }}
                </span>
              </td>
              <td class="reason-cell">{{ l.reason || '-' }}</td>
              <td>{{ l.confidence }}</td>
              <td>{{ l.elapsed_ms }}ms</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAIConfig, updateAIConfig, getAIStats, getAILogs,
  getSensitiveWords, addSensitiveWord, updateSensitiveWord, deleteSensitiveWord
} from '@/api/adminAi'

const activeTab = ref('stats')

const tabs = [
  { key: 'stats', label: '审核统计', icon: '📊' },
  { key: 'config', label: '审核配置', icon: '⚙️' },
  { key: 'words', label: '敏感词管理', icon: '🔤' },
  { key: 'logs', label: '审核日志', icon: '📋' },
]

// ─── 统计 ───

const stats = reactive({ total: 0, pass: 0, manual_review: 0, reject: 0, avgElapsedMs: 0, totalPromptTokens: 0, totalCompletionTokens: 0 })
const statsDays = ref(7)

const loadStats = async () => {
  try {
    const res = await getAIStats({ days: statsDays.value })
    Object.assign(stats, res.data)
  } catch (e) {
    console.error('加载AI统计失败:', e)
  }
}

// ─── 配置 ───

const config = reactive({})

const loadConfig = async () => {
  try {
    const res = await getAIConfig()
    Object.assign(config, res.data)
  } catch (e) {
    console.error('加载AI配置失败:', e)
  }
}

const saveConfig = async () => {
  try {
    await updateAIConfig(config)
    ElMessage.success('配置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

// ─── 敏感词 ───

const words = ref([])
const newWord = reactive({ word: '', level: 'blocked', category: '' })
const wordFilter = reactive({ level: '', category: '' })

const loadWords = async () => {
  try {
    const res = await getSensitiveWords({
      level: wordFilter.level || undefined,
      category: wordFilter.category || undefined,
    })
    words.value = res.data.list
  } catch (e) {
    console.error('加载敏感词失败:', e)
  }
}

const handleAddWord = async () => {
  if (!newWord.word.trim()) {
    ElMessage.warning('请输入敏感词')
    return
  }
  try {
    await addSensitiveWord({ word: newWord.word.trim(), level: newWord.level, category: newWord.category || null })
    ElMessage.success('已添加')
    newWord.word = ''
    loadWords()
  } catch (e) {
    ElMessage.error('添加失败，可能已存在')
  }
}

const toggleWord = async (w) => {
  try {
    await updateSensitiveWord(w.id, { is_active: w.is_active ? 0 : 1 })
    ElMessage.success(w.is_active ? '已禁用' : '已启用')
    loadWords()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleDeleteWord = async (id) => {
  try {
    await deleteSensitiveWord(id)
    ElMessage.success('已删除')
    loadWords()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

// ─── 日志 ───

const logs = ref([])
const logFilter = reactive({ verdict: '', content_type: '' })

const loadLogs = async () => {
  try {
    const res = await getAILogs({
      verdict: logFilter.verdict || undefined,
      content_type: logFilter.content_type || undefined,
      limit: 50,
    })
    logs.value = res.data.list
  } catch (e) {
    console.error('加载AI日志失败:', e)
  }
}

// ─── 工具函数 ───

const formatTokens = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

const typeLabel = (t) => {
  const m = { topic: '话题', speech: '发言', username: '用户名', post_title: '帖子标题', post_content: '帖子正文', comment: '评论' }
  return m[t] || t
}

const verdictLabel = (v) => {
  const m = { pass: '通过', manual_review: '待复核', reject: '拒绝' }
  return m[v] || v
}

const verdictBadge = (v) => {
  return { pass: 'badge-success', manual_review: 'badge-warn', reject: 'badge-danger' }[v] || ''
}

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN')
}

onMounted(() => {
  loadStats()
  loadWords()
})
</script>

<style scoped>
.ai-audit-admin { max-width: 1200px; }

/* ─── 子标签 ─── */
.sub-tabs {
  display: flex; gap: 8px; margin-bottom: 24px;
}
.sub-tab {
  padding: 8px 20px; border: 1px solid #e0e0e0; background: #fff;
  border-radius: 6px; cursor: pointer; font-size: 14px; color: #666;
  transition: all 0.3s;
}
.sub-tab:hover { border-color: #4a90e2; color: #4a90e2; }
.sub-tab.active { background: #4a90e2; color: #fff; border-color: #4a90e2; }

/* ─── 统计卡片 ─── */
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
.stat-card {
  background: #fff; padding: 24px; border-radius: 8px; text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.stat-card.pass { border-top: 3px solid #4caf50; }
.stat-card.warn { border-top: 3px solid #ff9800; }
.stat-card.reject { border-top: 3px solid #f44336; }
.stat-number { font-size: 28px; font-weight: 700; color: #333; }
.stat-label { font-size: 13px; color: #999; margin-top: 4px; }

.stat-controls { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #666; }
.stat-controls select { padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; }

/* ─── 通用卡片 ─── */
.section-card {
  background: #fff; padding: 24px; border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* ─── 配置 ─── */
.config-section h3 { font-size: 16px; margin-bottom: 12px; color: #333; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; }
.config-row {
  display: flex; align-items: center; gap: 12px; padding: 12px 0;
  border-bottom: 1px solid #fafafa;
}
.config-label { flex: 0 0 140px; font-size: 14px; color: #555; }
.config-input { width: 100px; padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; text-align: center; }
.config-hint { font-size: 12px; color: #aaa; }
.config-actions { margin-top: 20px; }
.btn-save {
  padding: 10px 40px; background: #4a90e2; color: #fff; border: none;
  border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;
}
.btn-save:hover { background: #357abd; }

/* ─── 开关 ─── */
.switch { position: relative; display: inline-block; width: 48px; height: 26px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background: #ccc; border-radius: 26px; transition: 0.3s;
}
.slider::before {
  content: ""; position: absolute; height: 20px; width: 20px; left: 3px; bottom: 3px;
  background: #fff; border-radius: 50%; transition: 0.3s;
}
input:checked + .slider { background: #4a90e2; }
input:checked + .slider::before { transform: translateX(22px); }

/* ─── 敏感词 ─── */
.words-toolbar { margin-bottom: 16px; }
.words-add { display: flex; gap: 8px; margin-bottom: 12px; }
.input-word { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; }
.select-level, .select-cat { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; }
.btn-add {
  padding: 8px 20px; background: #4a90e2; color: #fff; border: none;
  border-radius: 4px; cursor: pointer;
}
.btn-add:hover { background: #357abd; }
.words-filters { display: flex; gap: 12px; }
.words-filters select { padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; }

.words-table, .logs-table { width: 100%; border-collapse: collapse; }
.words-table th, .logs-table th {
  text-align: left; padding: 10px 12px; background: #f5f5f5;
  font-size: 13px; color: #666; border-bottom: 2px solid #e0e0e0;
}
.words-table td, .logs-table td {
  padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px;
}
.empty-cell { text-align: center; color: #999; padding: 40px !important; }
.reason-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ─── 徽章 ─── */
.badge {
  display: inline-block; padding: 2px 10px; border-radius: 10px;
  font-size: 12px; font-weight: 500;
}
.badge-success { background: #e8f5e9; color: #2e7d32; }
.badge-warn { background: #fff3e0; color: #e65100; }
.badge-danger { background: #ffebee; color: #c62828; }
.badge-gray { background: #f5f5f5; color: #999; }

/* ─── 按钮 ─── */
.btn-sm {
  padding: 4px 12px; border: 1px solid #ddd; background: #fff;
  border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 6px;
}
.btn-sm:hover { border-color: #4a90e2; color: #4a90e2; }
.btn-sm.btn-danger { color: #f44336; border-color: #f44336; }
.btn-sm.btn-danger:hover { background: #f44336; color: #fff; }

/* ─── 日志筛选 ─── */
.log-filters { display: flex; gap: 12px; margin-bottom: 16px; }
.log-filters select { padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; }
</style>
