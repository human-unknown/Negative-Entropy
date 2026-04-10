import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

const questions = [
  { q: '如果所有A是B，所有B是C，那么所有A是C。这个推理：', options: ['正确', '错误', '不确定', '无法判断'], answer: 0 },
  { q: '某班30人，喜欢数学20人，喜欢语文18人，两者都不喜欢3人。两者都喜欢的人数是：', options: ['8人', '9人', '10人', '11人'], answer: 3 },
  { q: '甲比乙高，乙比丙高，则：', options: ['甲最高', '丙最矮', '甲比丙高', '无法确定'], answer: 2 },
  { q: '一个数列：2, 5, 10, 17, 26, ?', options: ['35', '36', '37', '38'], answer: 2 },
  { q: '如果"并非所有天鹅都是白色"为真，则：', options: ['所有天鹅都不是白色', '至少有一只天鹅不是白色', '没有天鹅是白色', '大部分天鹅不是白色'], answer: 1 },
  { q: '三个开关控制三盏灯，只能进房间一次，如何确定对应关系？', options: ['无法确定', '开一个等5分钟再开另一个', '同时开两个', '随机尝试'], answer: 1 },
  { q: '有5个海盗分100金币，按等级投票，过半通过否则最高等级被扔下海。最高等级最少能分到：', options: ['1个', '2个', '50个', '98个'], answer: 3 },
  { q: '烧一根不均匀的绳子需1小时，如何计量45分钟？', options: ['无法计量', '两根绳子两端同时烧', '一根两端烧+一根一端烧', '切成四段'], answer: 2 }
]

const debateTopics = [
  '远程办公是否应该成为主流工作模式',
  '人工智能是否会取代大部分人类工作',
  '城市化进程是否应该继续加速',
  '高等教育是否应该完全免费',
  '是否应该对社交媒体使用时间进行法律限制',
  '电子书是否会完全取代纸质书',
  '是否应该对高收入群体征收更高税率'
]

export const generateTest = (req, res) => {
  const selected = questions.sort(() => Math.random() - 0.5).slice(0, 5)
  const testData = selected.map((item, index) => ({
    id: index,
    question: item.q,
    options: item.options
  }))
  res.json(success({ questions: testData }))
}

export const submitTest = async (req, res) => {
  const { userId, answers } = req.body

  if (!userId || !answers || !Array.isArray(answers)) {
    return res.json(error('参数错误', 400))
  }

  let correct = 0
  answers.forEach(ans => {
    const q = questions.find(item => item.q === ans.question)
    if (q && q.answer === ans.answer) correct++
  })

  const score = (correct / answers.length * 100).toFixed(2)

  try {
    const [existing] = await pool.query(
      'SELECT id FROM user_check WHERE user_id = ?',
      [userId]
    )

    if (existing.length > 0) {
      await pool.query(
        'UPDATE user_check SET logic_score = ?, updated_at = NOW() WHERE user_id = ?',
        [score, userId]
      )
    } else {
      await pool.query(
        'INSERT INTO user_check (user_id, logic_score) VALUES (?, ?)',
        [userId, score]
      )
    }

    res.json(success({ score: parseFloat(score), correct, total: answers.length }))
  } catch (err) {
    console.error('保存分数失败:', err)
    res.json(error('保存失败', 500))
  }
}

export const getDebateTopic = (req, res) => {
  const topic = debateTopics[Math.floor(Math.random() * debateTopics.length)]
  res.json(success({ topic }))
}

export const submitDebate = async (req, res) => {
  const { userId, topic, speech } = req.body

  if (!userId || !speech || speech.length < 50) {
    return res.json(error('发言内容至少50字', 400))
  }

  // AI评分逻辑
  let logicScore = 50
  let rationalScore = 50

  // 逻辑性评分
  if (/因为|所以|由于|因此|导致/.test(speech)) logicScore += 15
  if (/首先|其次|最后|第一|第二/.test(speech)) logicScore += 15
  if (/例如|比如|数据显示|研究表明/.test(speech)) logicScore += 20

  // 理性评分
  if (/[！!]{2,}|[？?]{2,}/.test(speech)) rationalScore -= 20
  if (/绝对|一定|必须|肯定/.test(speech)) rationalScore -= 10
  if (/可能|或许|也许|倾向于/.test(speech)) rationalScore += 20
  if (/但是|然而|不过|虽然/.test(speech)) rationalScore += 20

  const finalScore = ((logicScore + rationalScore) / 2).toFixed(2)

  try {
    const [existing] = await pool.query(
      'SELECT id FROM user_check WHERE user_id = ?',
      [userId]
    )

    if (existing.length > 0) {
      await pool.query(
        'UPDATE user_check SET debate_score = ?, updated_at = NOW() WHERE user_id = ?',
        [finalScore, userId]
      )
    } else {
      await pool.query(
        'INSERT INTO user_check (user_id, debate_score) VALUES (?, ?)',
        [userId, finalScore]
      )
    }

    res.json(success({
      score: parseFloat(finalScore),
      logicScore,
      rationalScore,
      passed: finalScore >= 60
    }))
  } catch (err) {
    console.error('保存辩论分数失败:', err)
    res.json(error('保存失败', 500))
  }
}

export const checkResult = async (req, res) => {
  const { userId } = req.params

  try {
    const [check] = await pool.query(
      'SELECT logic_score, debate_score, status, retry_count, limit_until FROM user_check WHERE user_id = ?',
      [userId]
    )

    if (check.length === 0) {
      return res.json(error('未找到审核记录', 404))
    }

    const record = check[0]
    const now = new Date()

    // 检查是否在限制期内
    if (record.limit_until && new Date(record.limit_until) > now) {
      return res.json(success({
        status: 'limited',
        message: '审核失败次数过多，请等待限制期结束',
        limitUntil: record.limit_until
      }))
    }

    // 检查是否完成两项测试
    if (!record.logic_score || !record.debate_score) {
      return res.json(success({
        status: 'incomplete',
        message: '请完成所有审核项目',
        logicScore: record.logic_score,
        debateScore: record.debate_score
      }))
    }

    const passed = record.logic_score >= 60 && record.debate_score >= 60

    if (passed) {
      // 审核通过，激活账号
      await pool.query(
        'UPDATE user_check SET status = 1, updated_at = NOW() WHERE user_id = ?',
        [userId]
      )
      await pool.query(
        'UPDATE user SET status = 1 WHERE id = ?',
        [userId]
      )
      return res.json(success({
        status: 'passed',
        message: '审核通过，账号已激活'
      }))
    }

    // 审核不通过
    const newRetryCount = record.retry_count + 1
    let limitUntil = null

    if (newRetryCount >= 3) {
      // 累计3次不合格，限制30天
      limitUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      await pool.query(
        'UPDATE user_check SET status = 2, retry_count = ?, limit_until = ?, updated_at = NOW() WHERE user_id = ?',
        [newRetryCount, limitUntil, userId]
      )
      return res.json(success({
        status: 'failed',
        message: '审核失败次数过多，限制30天后重试',
        retryCount: newRetryCount,
        limitUntil
      }))
    }

    // 不合格，24小时后可重试
    limitUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    await pool.query(
      'UPDATE user_check SET status = 2, retry_count = ?, limit_until = ?, updated_at = NOW() WHERE user_id = ?',
      [newRetryCount, limitUntil, userId]
    )
    res.json(success({
      status: 'failed',
      message: '审核未通过，24小时后可重试',
      retryCount: newRetryCount,
      limitUntil
    }))
  } catch (err) {
    console.error('查询审核结果失败:', err)
    res.json(error('查询失败', 500))
  }
}
