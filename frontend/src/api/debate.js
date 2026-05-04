import request from './request'

export const getDebateList = (params) => {
  return request.get('/debates', { params })
}

export const getDebateCategories = () => {
  return request.get('/debate/categories')
}

export const getDebateDetail = (topicId) => {
  return request.get(`/debate/topics/${topicId}`)
}

export const getSpeeches = (topicId, role) => {
  return request.get(`/debate/topics/${topicId}/speeches`, { params: { role } })
}

export const createDebate = (data) => {
  return request.post('/debate/topics', data)
}

export const joinDebate = (topicId, stance) => {
  return request.post(`/debate/topics/${topicId}/join`, { stance })
}

export const createSpeech = (topicId, content) => {
  return request.post(`/debate/topics/${topicId}/speeches`, { content })
}

export const createAudienceSpeech = (topicId, data) => {
  return request.post(`/debate/topics/${topicId}/audience-speeches`, data)
}

export const voteDebate = (topicId, stance) => {
  return request.post(`/debate/topics/${topicId}/vote`, { stance })
}

export const closeDebate = (topicId) => {
  return request.post(`/debate/topics/${topicId}/close`)
}

export const settleDebate = (topicId) => {
  return request.post(`/debate/topics/${topicId}/settle`)
}

export const getDebateResult = (topicId) => {
  return request.get(`/debate/topics/${topicId}/result`)
}
