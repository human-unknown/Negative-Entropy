import request from './request'

export const getCurrentRound = (topicId) => {
  return request.get(`/debate/topics/${topicId}/current-round`)
}

export const getRounds = (topicId) => {
  return request.get(`/debate/topics/${topicId}/rounds`)
}

export const submitRound = (topicId, roundId, content) => {
  return request.post(`/debate/topics/${topicId}/rounds/${roundId}/submit`, { content })
}

export const skipRound = (topicId, roundId) => {
  return request.post(`/debate/topics/${topicId}/rounds/${roundId}/skip`)
}
