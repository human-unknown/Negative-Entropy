import request from './request'

export const getTemplates = () => {
  return request.get('/debate/templates')
}

export const getTemplateDetail = (id) => {
  return request.get(`/debate/templates/${id}`)
}
