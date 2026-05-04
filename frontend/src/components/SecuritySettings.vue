<template>
  <div class="security-settings">
    <h2 class="section-title">
      账号安全
    </h2>
    
    <div class="security-item">
      <div class="item-info">
        <h3 class="item-title">
          双重认证
        </h3>
        <p class="item-desc">
          开启后登录需要验证码，提高账号安全性
        </p>
      </div>
      <div class="item-action">
        <button 
          class="toggle-btn" 
          :class="{ active: twoFactorEnabled }"
          :disabled="loading"
          @click="toggle2FA"
        >
          {{ twoFactorEnabled ? '已开启' : '已关闭' }}
        </button>
      </div>
    </div>

    <div class="security-item">
      <div class="item-info">
        <h3 class="item-title">
          修改密码
        </h3>
        <p class="item-desc">
          定期修改密码可提高账号安全
        </p>
      </div>
      <div class="item-action">
        <button
          class="action-btn"
          @click="$router.push('/reset-password')"
        >
          去修改
        </button>
      </div>
    </div>

    <!-- 验证码弹窗 -->
    <div
      v-if="showVerifyModal"
      class="modal-overlay"
      @click="closeModal"
    >
      <div
        class="modal-content"
        @click.stop
      >
        <h3 class="modal-title">
          验证身份
        </h3>
        <p class="modal-desc">
          验证码已发送至您的{{ userContact }}
        </p>
        
        <input 
          v-model="verifyCode"
          type="text"
          placeholder="请输入验证码"
          class="verify-input"
          maxlength="6"
        >
        
        <div class="modal-actions">
          <button
            class="modal-btn cancel"
            @click="closeModal"
          >
            取消
          </button>
          <button
            class="modal-btn confirm"
            :disabled="!verifyCode || verifying"
            @click="confirmToggle"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { enable2FA, send2FACode, verify2FA } from '../api/security'
import { showMessage } from '../utils/message'

const twoFactorEnabled = ref(false)
const loading = ref(false)
const showVerifyModal = ref(false)
const verifyCode = ref('')
const verifying = ref(false)
const userContact = ref('')
const pendingAction = ref(null)

const userId = ref(localStorage.getItem('userId') || '')

onMounted(async () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  twoFactorEnabled.value = userInfo.two_factor_enabled || false
  userContact.value = userInfo.phone || userInfo.email || ''
})

const toggle2FA = async () => {
  if (loading.value) return
  
  pendingAction.value = !twoFactorEnabled.value
  
  if (pendingAction.value) {
    loading.value = true
    try {
      await send2FACode(userId.value)
      showVerifyModal.value = true
    } catch (error) {
      showMessage('发送验证码失败', 'error')
    } finally {
      loading.value = false
    }
  } else {
    await updateSetting(false)
  }
}

const confirmToggle = async () => {
  if (!verifyCode.value || verifying.value) return
  
  verifying.value = true
  try {
    const res = await verify2FA(userId.value, verifyCode.value)
    if (res.code === 200) {
      await updateSetting(pendingAction.value)
      closeModal()
    } else {
      showMessage(res.message || '验证失败', 'error')
    }
  } catch (error) {
    showMessage('验证失败', 'error')
  } finally {
    verifying.value = false
  }
}

const updateSetting = async (enable) => {
  loading.value = true
  try {
    const res = await enable2FA(userId.value, enable)
    if (res.code === 200) {
      twoFactorEnabled.value = enable
      showMessage(enable ? '双重认证已开启' : '双重认证已关闭', 'success')
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      userInfo.two_factor_enabled = enable
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    } else {
      showMessage(res.message || '设置失败', 'error')
    }
  } catch (error) {
    showMessage('设置失败', 'error')
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  showVerifyModal.value = false
  verifyCode.value = ''
  pendingAction.value = null
}
</script>

<style scoped>
.security-settings {
  max-width: 800px;
}

.section-title {
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  margin-bottom: 16px;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.item-info {
  flex: 1;
}

.item-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.item-desc {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.item-action {
  margin-left: 20px;
}

.toggle-btn, .action-btn {
  padding: 8px 24px;
  border: 1px solid #ddd;
  background: #fff;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.toggle-btn.active {
  border-color: #4caf50;
  background: #4caf50;
  color: #fff;
}

.toggle-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn:hover {
  border-color: #333;
  color: #333;
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
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.modal-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.modal-desc {
  margin: 0 0 20px;
  font-size: 14px;
  color: #666;
}

.verify-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  margin-bottom: 20px;
}

.verify-input:focus {
  outline: none;
  border-color: #333;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.modal-btn.cancel:hover {
  background: #e0e0e0;
}

.modal-btn.confirm {
  background: #333;
  color: #fff;
}

.modal-btn.confirm:hover:not(:disabled) {
  background: #000;
}

.modal-btn.confirm:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .security-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-action {
    margin-left: 0;
    margin-top: 16px;
    width: 100%;
  }

  .toggle-btn, .action-btn {
    width: 100%;
  }
}
</style>
