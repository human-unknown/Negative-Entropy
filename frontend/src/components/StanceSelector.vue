<template>
  <div class="stance-selector">
    <h3>选择你的立场</h3>
    <div class="options">
      <div 
        :class="['option', 'pro', { disabled: proFull }]"
        @click="selectStance(1)"
      >
        <div class="icon">
          ⚔️
        </div>
        <div class="label">
          正方
        </div>
        <div class="count">
          {{ proCount }}/{{ topic.pro_limit }}
        </div>
        <div
          v-if="proFull"
          class="full-tag"
        >
          已满
        </div>
      </div>

      <div 
        :class="['option', 'con', { disabled: conFull }]"
        @click="selectStance(2)"
      >
        <div class="icon">
          🛡️
        </div>
        <div class="label">
          反方
        </div>
        <div class="count">
          {{ conCount }}/{{ topic.con_limit }}
        </div>
        <div
          v-if="conFull"
          class="full-tag"
        >
          已满
        </div>
      </div>

      <div 
        class="option audience"
        @click="selectStance(3)"
      >
        <div class="icon">
          👥
        </div>
        <div class="label">
          观众
        </div>
        <div class="count">
          {{ audienceCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { joinDebate } from '@/api/debate'
import { ElMessage } from 'element-plus'

const props = defineProps({
  topic: {
    type: Object,
    required: true
  },
  proCount: {
    type: Number,
    default: 0
  },
  conCount: {
    type: Number,
    default: 0
  },
  audienceCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['joined'])

const proFull = computed(() => props.proCount >= props.topic.pro_limit)
const conFull = computed(() => props.conCount >= props.topic.con_limit)

const selectStance = async (stance) => {
  if (stance === 1 && proFull.value) {
    ElMessage.warning('正方人数已满')
    return
  }
  if (stance === 2 && conFull.value) {
    ElMessage.warning('反方人数已满')
    return
  }

  try {
    await joinDebate(props.topic.id, stance)
    const stanceText = stance === 1 ? '正方' : stance === 2 ? '反方' : '观众'
    ElMessage.success(`已加入${stanceText}`)
    emit('joined', stance)
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
.stance-selector {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
}

h3 {
  text-align: center;
  margin-bottom: 25px;
  color: var(--color-text);
  font-size: 18px;
}

.options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 30px 20px;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.option:not(.disabled):hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.option.pro:not(.disabled):hover {
  border-color: var(--color-primary);
}

.option.con:not(.disabled):hover {
  border-color: var(--color-danger);
}

.option.audience:hover {
  border-color: var(--color-warning);
}

.icon {
  font-size: 48px;
}

.label {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.count {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.full-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  background: var(--color-danger);
  color: #fff;
  border-radius: 12px;
  font-size: 12px;
}

@media (max-width: 768px) {
  .stance-selector {
    padding: 20px;
  }

  .options {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .option {
    padding: 25px 20px;
  }

  .icon {
    font-size: 40px;
  }

  .label {
    font-size: 16px;
  }
}
</style>
