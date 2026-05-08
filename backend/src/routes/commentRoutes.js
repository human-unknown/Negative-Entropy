import express from 'express'
import { getComments, createComment, deleteComment, upvoteComment } from '../controllers/commentController.js'
import { auth } from '../middlewares/auth.js'
import { requireLevel } from '../middlewares/permission.js'
import { USER_LEVEL } from '../constants/userLevel.js'

const router = express.Router({ mergeParams: true })

// 公开接口
router.get('/', getComments)

// 需要 Lv2+
router.post('/', auth, requireLevel(USER_LEVEL.INTERMEDIATE), createComment)

// 独立路径：评论操作
const standaloneRouter = express.Router()
standaloneRouter.delete('/:commentId', auth, requireLevel(USER_LEVEL.INTERMEDIATE), deleteComment)
standaloneRouter.post('/:commentId/upvote', auth, requireLevel(USER_LEVEL.INTERMEDIATE), upvoteComment)

export { router as default, standaloneRouter as commentActionRouter }
