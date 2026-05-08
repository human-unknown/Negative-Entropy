import request from './request'

export const getChannels = () => {
  return request.get('/channels')
}
