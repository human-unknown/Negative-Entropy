import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 辩论 Store — 缓存当前辩论状态，减少重复 API 请求
 */
export const useDebateStore = defineStore('debate', () => {
  // ---- state ----
  const currentDebate = ref(null)
  const speeches = ref([])
  const voteSummary = ref(null)
  const participants = ref([])

  // ---- actions ----
  function setCurrentDebate(debate) {
    currentDebate.value = debate
  }

  function setSpeeches(list) {
    speeches.value = list
  }

  function appendSpeech(speech) {
    speeches.value.push(speech)
  }

  function setVoteSummary(summary) {
    voteSummary.value = summary
  }

  function setParticipants(list) {
    participants.value = list
  }

  function clear() {
    currentDebate.value = null
    speeches.value = []
    voteSummary.value = null
    participants.value = []
  }

  return {
    currentDebate,
    speeches,
    voteSummary,
    participants,
    setCurrentDebate,
    setSpeeches,
    appendSpeech,
    setVoteSummary,
    setParticipants,
    clear,
  }
})
