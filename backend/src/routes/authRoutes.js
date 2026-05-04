import express from 'express'
import { body } from 'express-validator'
import { login, register } from '../controllers/authController.js'

const router = express.Router()

// 中国姓氏列表（常见100个）
const surnames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '朱', '马', '胡', '郭', '林', '何', '高', '梁', '郑', '罗', '宋', '谢', '唐', '韩', '曹', '许', '邓', '萧', '冯', '曾', '程', '蔡', '彭', '潘', '袁', '于', '董', '余', '苏', '叶', '吕', '魏', '蒋', '田', '杜', '丁', '沈', '姜', '范', '江', '傅', '钟', '卢', '汪', '戴', '崔', '任', '陆', '廖', '姚', '方', '金', '邱', '夏', '谭', '韦', '贾', '邹', '石', '熊', '孟', '秦', '阎', '薛', '侯', '雷', '白', '龙', '段', '郝', '孔', '邵', '史', '毛', '常', '万', '顾', '赖', '武', '康', '贺', '严', '尹', '钱', '施', '牛', '洪', '龚']

router.post('/login', login)

router.post('/register', [
  body('account').trim().notEmpty().withMessage('账号不能为空')
    .isLength({ min: 3, max: 50 }).withMessage('账号长度为3-50个字符'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  body('name').trim().notEmpty().withMessage('姓名不能为空')
    .custom(value => {
      if (!surnames.some(s => value.startsWith(s))) {
        throw new Error('姓名必须包含真实姓氏')
      }
      if (/[0-9]/.test(value) || /[a-zA-Z]{2,}/.test(value)) {
        throw new Error('姓名不得娱乐化')
      }
      return true
    }),
  body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
  body().custom((value, { req }) => {
    if (!req.body.phone && !req.body.email) {
      throw new Error('手机号和邮箱至少填写一项')
    }
    return true
  })
], register)

export default router
