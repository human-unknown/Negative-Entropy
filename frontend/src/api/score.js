import request from './request'

export const submitScore = (topicId, scores) => {
  return request.post(`/debate/topics/${topicId}/score`, { scores })
}

export const getScoreResult = (topicId) => {
  return request.get(`/debate/topics/${topicId}/score-result`)
}
