import request from './request'

export const getPosts = (params) => {
  return request.get('/posts', { params })
}

export const getPostDetail = (postId) => {
  return request.get(`/posts/${postId}`)
}

export const createPost = (data) => {
  return request.post('/posts', data)
}

export const updatePost = (postId, data) => {
  return request.put(`/posts/${postId}`, data)
}

export const deletePost = (postId) => {
  return request.delete(`/posts/${postId}`)
}

export const togglePin = (postId) => {
  return request.post(`/posts/${postId}/pin`)
}

export const startDebateFromPost = (postId) => {
  return request.post(`/posts/${postId}/debate`)
}

export const scorePost = (postId, data) => {
  return request.post(`/posts/${postId}/score`, data)
}
