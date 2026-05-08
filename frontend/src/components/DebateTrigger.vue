<template>
  <div v-if="hasDebate || canStart" class="debate-trigger">
    <el-divider />
    <div class="trigger-inner">
      <el-button
        v-if="hasDebate"
        type="warning"
        @click="viewDebate"
      >
        ⚔️ 查看辩论
      </el-button>
      <template v-else-if="canStart">
        <el-button type="warning" @click="confirmStart">
          ⚔️ 开启辩论
        </el-button>
      </template>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="开启辩论"
      width="420px"
    >
      <p>将此帖子升级为结构化辩论？</p>
      <p class="dialog-hint">辩论将包含正反双方、轮次发言和投票结算。</p>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doStart">确认开启</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  postId: { type: [Number, String], required: true },
  debateId: { type: [Number, String], default: null },
  hasDebate: { type: Boolean, default: false },
  canStart: { type: Boolean, default: false }
})
const emit = defineEmits(['start'])

const router = useRouter()
const dialogVisible = ref(false)

const confirmStart = () => {
  dialogVisible.value = true
}

const doStart = () => {
  dialogVisible.value = false
  emit('start', props.postId)
}

const viewDebate = () => {
  router.push(`/debates/flow?topicId=${props.debateId}`)
}
</script>

<style scoped>
.debate-trigger {
  margin-top: 8px;
}
.trigger-inner {
  text-align: center;
  padding: 8px 0;
}
.dialog-hint {
  color: #909399;
  font-size: 13px;
}
</style>
