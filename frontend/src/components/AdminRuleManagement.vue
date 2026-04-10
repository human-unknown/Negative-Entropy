<template>
  <div class="rule-management">
    <div class="action-bar">
      <button class="btn-primary" @click="showDebateModal = true">
        🗳️ 发起规则修改辩论
      </button>
    </div>

    <div v-if="rules.length > 0" class="rule-list">
      <div
        v-for="rule in rules"
        :key="rule.id"
        class="rule-card"
      >
        <div class="rule-header">
          <h3 class="rule-title">{{ rule.title }}</h3>
          <button class="btn-edit" @click="editRule(rule)">✏️ 编辑</button>
        </div>
        
        <div class="rule-content">
          <div class="rule-text">{{ rule.content }}</div>
          <div class="rule-meta">
            <span class="meta-item">版本：v{{ rule.version }}</span>
            <span class="meta-item">更新时间：{{ formatDate(rule.updated_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-data">
      暂无规则
    </div>

    <div v-if="showDebateModal" class="modal-overlay" @click="closeDebateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>发起规则修改辩论</h3>
          <button class="close-btn" @click="closeDebateModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>选择规则：</label>
            <select v-model="debateForm.ruleId" class="form-select">
              <option value="">请选择</option>
              <option v-for="rule in rules" :key="rule.id" :value="rule.id">
                {{ rule.title }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>修改提案：</label>
            <textarea
              v-model="debateForm.proposal"
              placeholder="请描述规则修改提案"
              rows="4"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-group">
            <label>修改理由：</label>
            <textarea
              v-model="debateForm.reason"
              placeholder="请说明修改理由"
              rows="4"
              class="form-textarea"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeDebateModal">取消</button>
          <button class="btn-confirm" @click="submitDebate">发起辩论</button>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑规则</h3>
          <button class="close-btn" @click="closeEditModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>规则标题：</label>
            <input
              v-model="editForm.title"
              type="text"
              class="form-input"
              placeholder="规则标题"
            />
          </div>
          <div class="form-group">
            <label>规则内容：</label>
            <textarea
              v-model="editForm.content"
              rows="8"
              class="form-textarea"
              placeholder="规则内容"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeEditModal">取消</button>
          <button class="btn-confirm" @click="saveRule">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const rules = ref([])
const showDebateModal = ref(false)
const showEditModal = ref(false)
const debateForm = ref({
  ruleId: '',
  proposal: '',
  reason: ''
})
const editForm = ref({
  id: null,
  title: '',
  content: ''
})

onMounted(() => {
  loadRules()
})

const loadRules = () => {
  console.log('加载规则列表')
  // TODO: 调用API获取规则列表
}

const editRule = (rule) => {
  editForm.value = {
    id: rule.id,
    title: rule.title,
    content: rule.content
  }
  showEditModal.value = true
}

const closeDebateModal = () => {
  showDebateModal.value = false
  debateForm.value = { ruleId: '', proposal: '', reason: '' }
}

const closeEditModal = () => {
  showEditModal.value = false
  editForm.value = { id: null, title: '', content: '' }
}

const submitDebate = () => {
  if (!debateForm.value.ruleId || !debateForm.value.proposal || !debateForm.value.reason) {
    alert('请填写完整信息')
    return
  }
  console.log('发起规则修改辩论:', debateForm.value)
  // TODO: 调用API发起辩论
  closeDebateModal()
}

const saveRule = () => {
  if (!editForm.value.title || !editForm.value.content) {
    alert('请填写完整信息')
    return
  }
  console.log('保存规则:', editForm.value)
  // TODO: 调用API保存规则
  closeEditModal()
  loadRules()
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.rule-management {
  max-width: 1200px;
}

.action-bar {
  margin-bottom: 24px;
}

.btn-primary {
  padding: 12px 24px;
  background: #4a90e2;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary:hover {
  background: #357abd;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rule-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.rule-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.btn-edit {
  padding: 8px 16px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-edit:hover {
  background: #e0e0e0;
}

.rule-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
}

.rule-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.no-data {
  background: #fff;
  padding: 60px;
  text-align: center;
  color: #999;
  font-size: 14px;
  border-radius: 8px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #4a90e2;
}

.form-textarea {
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: #4a90e2;
  color: #fff;
}

.btn-confirm:hover {
  background: #357abd;
}
</style>
