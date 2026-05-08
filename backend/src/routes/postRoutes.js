import express from 'express'
import {
  getPosts, getPostDetail, createPost, updatePost, deletePost,
  togglePin, startDebateFromPost, scorePost
} from '../controllers/postController.js'
import { auth } from '../middlewares/auth.js'
import { requireLevel, requireAdmin } from '../middlewares/permission.js'
import { USER_LEVEL } from '../constants/userLevel.js'

const router = express.Router()

// 公开接口
router.get('/', getPosts)
router.get('/:postId', getPostDetail)

// 需要 Lv2+（通过逻辑测试）
router.post('/', auth, requireLevel(USER_LEVEL.INTERMEDIATE), createPost)
router.put('/:postId', auth, requireLevel(USER_LEVEL.INTERMEDIATE), updatePost)
router.delete('/:postId', auth, requireLevel(USER_LEVEL.INTERMEDIATE), deletePost)
router.post('/:postId/score', auth, requireLevel(USER_LEVEL.INTERMEDIATE), scorePost)

// 需要 Lv3+
router.post('/:postId/debate', auth, requireLevel(USER_LEVEL.ADVANCED), startDebateFromPost)

// 管理员
router.post('/:postId/pin', auth, requireAdmin, togglePin)

export default router
