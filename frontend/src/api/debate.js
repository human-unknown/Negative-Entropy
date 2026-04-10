import request from './request'

export const getDebateList = (params) => {
  return request.get('/debates', { params })
}

export const getDebateCategories = () => {
  return request.get('/debates/categories')
}

export const getDebateDetail = (topicId) => {
  return request.get(`/debates/topics/${topicId}`)
}

export const getSpeeches = (topicId, role) => {
  return request.get(`/debates/topics/${topicId}/speeches`, { params: { role } })
}

export const createDebate = (data) => {
  return request.post('/debates/topics', data)
}

export const joinDebate = (topicId, stance) => {
  return request.post(`/debates/topics/${topicId}/join`, { stance })
}

export const createSpeech = (topicId, content) => {
  return request.post(`/debates/topics/${topicId}/speeches`, { content })
}

export const createAudienceSpeech = (topicId, data) => {
  return request.post(`/debates/topics/${topicId}/audience-speeches`, data)
}

export const voteDebate = (topicId, stance) => {
  return request.post(`/debates/topics/${topicId}/vote`, { stance })
}

export const closeDebate = (topicId) => {
  return request.post(`/debates/topics/${topicId}/close`)
}

export const settleDebate = (topicId) => {
  return request.post(`/debates/topics/${topicId}/settle`)
}

export const getDebateResult = (topicId) => {
  return request.get(`/debates/topics/${topicId}/result`)
}
