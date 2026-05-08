import request from './request'

export const getComments = (postId, params) => {
  return request.get(`/posts/${postId}/comments`, { params })
}

export const createComment = (postId, data) => {
  return request.post(`/posts/${postId}/comments`, data)
}

export const deleteComment = (commentId) => {
  return request.delete(`/comments/${commentId}`)
}

export const upvoteComment = (commentId) => {
  return request.post(`/comments/${commentId}/upvote`)
}
