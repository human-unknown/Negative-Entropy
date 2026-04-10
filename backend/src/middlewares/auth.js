import jwt from 'jsonwebtoken'
import config from '../config/app.js'
import { error } from '../utils/response.js'

export const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json(error('未提供认证令牌', 401))
    }
    
    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json(error('认证失败', 401))
  }
}
