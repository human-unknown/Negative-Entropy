<template>
  <div class="username-validator">
    <input 
      v-model="localValue"
      type="text"
      placeholder="请输入真实姓名"
      class="validator-input"
      @input="handleInput"
    />
    <div v-if="localValue" class="validation-result">
      <span :class="['status', isValid ? 'valid' : 'invalid']">
        {{ isValid ? '✓' : '✗' }}
      </span>
      <span class="message">{{ message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue', 'validate'])

const localValue = ref(props.modelValue || '')
const isValid = ref(false)
const message = ref('')

const surnames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '朱', '马', '胡', '郭', '林', '何', '高', '梁', '郑', '罗', '宋', '谢', '唐', '韩', '曹', '许', '邓', '萧', '冯', '曾', '程', '蔡', '彭', '潘', '袁', '于', '董', '余', '苏', '叶', '吕', '魏', '蒋', '田', '杜', '丁', '沈', '姜', '范', '江', '傅', '钟', '卢', '汪', '戴', '崔', '任', '陆', '廖', '姚', '方', '金', '邱', '夏', '谭', '韦', '贾', '邹', '石', '熊', '孟', '秦', '阎', '薛', '侯', '雷', '白', '龙', '段', '郝', '孔', '邵', '史', '毛', '常', '万', '顾', '赖', '武', '康', '贺', '严', '尹', '钱', '施', '牛', '洪', '龚']

const entertainmentChars = /[0-9a-zA-Z!@#$%^&*()_+=\[\]{};':"\\|,.<>?\/~`·！@#￥%……&*（）——+=【】{}；'："、|《》？，。]/

const handleInput = () => {
  emit('update:modelValue', localValue.value)
  validate()
}

const validate = () => {
  if (!localValue.value) {
    isValid.value = false
    message.value = ''
    emit('validate', { valid: false, message: '' })
    return
  }

  if (entertainmentChars.test(localValue.value)) {
    isValid.value = false
    message.value = '禁止使用数字、字母、特殊符号等娱乐化字符'
    emit('validate', { valid: false, message: message.value })
    return
  }

  const hasSurname = surnames.some(s => localValue.value.startsWith(s))
  if (!hasSurname) {
    isValid.value = false
    message.value = '必须包含真实姓氏'
    emit('validate', { valid: false, message: message.value })
    return
  }

  isValid.value = true
  message.value = '姓名格式正确'
  emit('validate', { valid: true, message: message.value })
}

watch(() => props.modelValue, (val) => {
  localValue.value = val || ''
  validate()
})
</script>

<style scoped>
.username-validator {
  width: 100%;
}

.validator-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.validator-input:focus {
  outline: none;
  border-color: #333;
}

.validation-result {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
}

.status {
  font-weight: bold;
}

.status.valid {
  color: #4caf50;
}

.status.invalid {
  color: #f44336;
}

.message {
  color: #666;
}
</style>
