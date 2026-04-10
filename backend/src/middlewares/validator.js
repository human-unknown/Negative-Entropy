import { validationResult } from 'express-validator'
import { error } from '../utils/response.js'

export const validate = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const message = errors.array()[0].msg
    return res.status(400).json(error(message, 400))
  }
  
  next()
}
