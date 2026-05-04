<template>
  <div class="profile-settings">
    <h3 class="section-title">
      系统设置
    </h3>

    <div class="settings-list">
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            意见反馈
          </div>
          <div class="setting-desc">
            告诉我们您的想法，帮助我们改进平台
          </div>
        </div>
        <button
          class="setting-btn"
          @click="showFeedback = true"
        >
          去反馈
        </button>
      </div>
    </div>

    <div
      v-if="showFeedback"
      class="feedback-overlay"
      @click.self="showFeedback = false"
    >
      <div class="feedback-wrapper">
        <FeedbackForm />
        <button
          class="close-feedback-btn"
          @click="showFeedback = false"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FeedbackForm from '@/components/FeedbackForm.vue'

const showFeedback = ref(false)
</script>

<style scoped>
.profile-settings { max-width: 800px; }

.section-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f9f9f9;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.setting-label {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 13px;
  color: #999;
}

.setting-btn {
  padding: 8px 20px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  margin-left: 16px;
}

.setting-btn:hover { background: #66b1ff; }

.feedback-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.feedback-wrapper {
  width: 90%;
  max-width: 560px;
}

.close-feedback-btn {
  display: block;
  margin: 16px auto 0;
  padding: 10px 32px;
  background: #fff;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.close-feedback-btn:hover {
  background: #f5f5f5;
}
</style>
