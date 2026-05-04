// Mock数据服务
const mockUsers = []

// 预置管理员账号
mockUsers.push({
  id: 999,
  name: '管理员',
  phone: '13900000001',
  email: 'admin@negentropy.com',
  level: 4,
  exp: 99999,
  status: 1,
  created_at: new Date().toISOString()
})

let mockDebates = []
let mockSpeeches = []
const mockVotes = []
let currentUserId = null

// 初始化mock数据
const initMockData = () => {
  mockDebates = [
    {
      id: 1,
      title: 'AI是否会取代人类工作',
      description: '随着人工智能技术的发展，越来越多的工作可能被自动化取代',
      category: 'tech',
      status: 1,
      publisher_id: 1,
      publisher_name: '张三',
      participant_count: 15,
      heat: 230,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      pro_count: 8,
      con_count: 7
    },
    {
      id: 2,
      title: '远程办公是否应该成为常态',
      description: '疫情后远程办公模式的利弊分析',
      category: 'society',
      status: 1,
      publisher_id: 2,
      publisher_name: '李四',
      participant_count: 23,
      heat: 180,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      pro_count: 12,
      con_count: 11
    },
    {
      id: 3,
      title: '传统文化在现代社会的价值',
      description: '探讨传统文化在当代的传承与创新',
      category: 'culture',
      status: 0,
      publisher_id: 3,
      publisher_name: '王五',
      participant_count: 5,
      heat: 95,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      pro_count: 3,
      con_count: 2
    }
  ]

  mockSpeeches = [
    {
      id: 1,
      topic_id: 1,
      user_id: 1,
      user_name: '张三',
      stance: 1,
      content: 'AI确实会取代部分重复性工作，但同时也会创造新的就业机会',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 2,
      topic_id: 1,
      user_id: 2,
      user_name: '李四',
      stance: 0,
      content: '人类的创造力和情感是AI无法替代的核心竞争力',
      created_at: new Date(Date.now() - 1800000).toISOString()
    }
  ]
}

initMockData()

let mockRules = null
const mockRuleDebates = []
let currentRuleDebateId = 0

const getMockRules = () => {
  if (mockRules) return mockRules
  mockRules = [
    { id: 1, title: '辩论发言规则', content: '每位辩手单次发言字数10-500字，发言间隔60秒', version: 2, updated_at: new Date().toISOString() },
    { id: 2, title: '投票权重规则', content: '普通用户权重1.0，进阶用户1.0，资深用户1.5，管理员2.0', version: 1, updated_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, title: '用户等级规则', content: '入门(1)、进阶(2)、资深(3)、管理员(4)，通过逻辑测试和辩论考核可升级', version: 3, updated_at: new Date(Date.now() - 172800000).toISOString() }
  ]
  return mockRules
}

export const mockApi = {
  // 注册
  register: async (data) => {
    const userId = mockUsers.length + 1
    const user = {
      id: userId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      level: 0,
      exp: 0,
      created_at: new Date().toISOString()
    }
    mockUsers.push(user)
    return { code: 200, data: { userId }, message: '注册成功' }
  },

  // 登录
  login: async (data) => {
    const user = mockUsers.find(u => u.phone === data.account || u.email === data.account)
    if (!user) {
      const newUser = {
        id: mockUsers.length + 1,
        name: '测试用户',
        phone: data.account,
        level: 2,
        exp: 150,
        created_at: new Date().toISOString()
      }
      mockUsers.push(newUser)
      currentUserId = newUser.id
      return { 
        code: 200, 
        data: { 
          token: `mock-token-${  newUser.id}`,
          user: newUser
        }
      }
    }
    currentUserId = user.id
    return { 
      code: 200, 
      data: { 
        token: `mock-token-${  user.id}`,
        user
      }
    }
  },

  // 获取辩论列表
  getDebateList: async (params) => {
    let list = [...mockDebates]
    
    if (params.category) {
      list = list.filter(d => d.category === params.category)
    }
    
    if (params.keyword) {
      list = list.filter(d => 
        d.title.includes(params.keyword) || 
        d.description.includes(params.keyword)
      )
    }
    
    if (params.sort === 'heat') {
      list.sort((a, b) => b.heat - a.heat)
    } else if (params.sort === 'participants') {
      list.sort((a, b) => b.participant_count - a.participant_count)
    } else {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
    
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize
    
    return {
      code: 200,
      data: {
        list: list.slice(start, end),
        total: list.length
      }
    }
  },

  // 获取辩论详情
  getDebateDetail: async (topicId) => {
    const debate = mockDebates.find(d => d.id === parseInt(topicId))
    if (!debate) {
      return { code: 404, message: '辩论不存在' }
    }
    return { code: 200, data: debate }
  },

  // 创建辩论
  createDebate: async (data) => {
    const newDebate = {
      id: mockDebates.length + 1,
      ...data,
      status: 0,
      publisher_id: currentUserId,
      publisher_name: '当前用户',
      participant_count: 0,
      heat: 0,
      created_at: new Date().toISOString(),
      pro_count: 0,
      con_count: 0
    }
    mockDebates.unshift(newDebate)
    return { code: 200, data: { topicId: newDebate.id } }
  },

  // 加入辩论
  joinDebate: async (topicId, stance) => {
    const debate = mockDebates.find(d => d.id === parseInt(topicId))
    if (debate) {
      debate.participant_count++
      if (stance === 1) debate.pro_count++
      else debate.con_count++
    }
    return { code: 200, message: '加入成功' }
  },

  // 获取发言列表
  getSpeeches: async (topicId, role) => {
    let list = mockSpeeches.filter(s => s.topic_id === parseInt(topicId))
    if (role) {
      list = list.filter(s => s.stance === parseInt(role))
    }
    return { code: 200, data: { list } }
  },

  // 发表发言
  createSpeech: async (topicId, content) => {
    const newSpeech = {
      id: mockSpeeches.length + 1,
      topic_id: parseInt(topicId),
      user_id: currentUserId,
      user_name: '当前用户',
      stance: 1,
      content,
      created_at: new Date().toISOString()
    }
    mockSpeeches.push(newSpeech)
    return { code: 200, data: newSpeech }
  },

  // 投票
  voteDebate: async (topicId, stance) => {
    const vote = {
      id: mockVotes.length + 1,
      topic_id: parseInt(topicId),
      user_id: currentUserId,
      stance,
      created_at: new Date().toISOString()
    }
    mockVotes.push(vote)
    return { code: 200, message: '投票成功' }
  },

  // 获取用户信息
  getUserInfo: async () => {
    const user = mockUsers.find(u => u.id === currentUserId) || {
      id: 1,
      name: '测试用户',
      level: 2,
      exp: 150,
      phone: '13800138000'
    }
    return { code: 200, data: user }
  },

  // 获取逻辑测试题目
  getLogicTest: async () => {
    return {
      code: 200,
      data: {
        questions: [
          { question: '如果所有A都是B，所有B都是C，那么所有A都是C', options: ['正确', '错误', '无法判断'] },
          { question: '张三比李四高，李四比王五高，那么张三比王五高', options: ['正确', '错误', '无法判断'] },
          { question: '有些猫是黑色的，所有黑色的动物都怕光，因此有些猫怕光', options: ['正确', '错误', '无法判断'] },
          { question: '如果下雨，地面就会湿。地面湿了，所以下雨了', options: ['正确', '错误', '无法判断'] },
          { question: '所有程序员都会编程，小明会编程，所以小明是程序员', options: ['正确', '错误', '无法判断'] }
        ]
      }
    }
  },

  // 提交逻辑测试
  // eslint-disable-next-line no-unused-vars
  submitLogicTest: async (_data) => {
    const correct = Math.floor(Math.random() * 2) + 3
    const total = 5
    const score = Math.floor((correct / total) * 100)
    return { code: 200, data: { score, correct, total, passed: correct >= 3 } }
  },

  // 获取辩论测试题目
  getDebateTopic: async () => {
    const topics = ['人工智能是否会取代人类工作', '远程办公是否应该成为常态', '传统文化在现代社会是否还有价值']
    return { code: 200, data: { topic: topics[Math.floor(Math.random() * topics.length)] } }
  },

  // 提交辩论测试
  // eslint-disable-next-line no-unused-vars
  submitDebateTest: async (_data) => {
    const logicScore = Math.floor(Math.random() * 20) + 70
    const rationalScore = Math.floor(Math.random() * 20) + 70
    const score = Math.floor((logicScore + rationalScore) / 2)
    return { code: 200, data: { score, logicScore, rationalScore, passed: score >= 60 } }
  },

  // 获取审核结果
  // eslint-disable-next-line no-unused-vars
  getCheckResult: async (_userId) => {
    return {
      code: 200,
      data: {
        status: 'passed',
        message: '恭喜！您已通过所有考核，可以开始使用平台功能',
        logicScore: 85,
        debateScore: 78
      }
    }
  },

  // 规则管理
  getRules: async () => {
    return { code: 200, data: { list: getMockRules() } }
  },

  saveRule: async (data) => {
    const rules = getMockRules()
    const idx = rules.findIndex(r => r.id === data.id)
    if (idx >= 0) {
      rules[idx] = { ...rules[idx], ...data, updated_at: new Date().toISOString(), version: rules[idx].version + 1 }
    } else {
      const newRule = { ...data, id: rules.length + 1, version: 1, updated_at: new Date().toISOString() }
      rules.push(newRule)
    }
    return { code: 200, message: '规则已保存' }
  },

  // 规则辩论
  createRuleDebate: async (data) => {
    currentRuleDebateId++
    const debate = {
      id: currentRuleDebateId,
      ...data,
      status: 0,
      creator_id: currentUserId,
      created_at: new Date().toISOString(),
      yes_count: 0,
      no_count: 0
    }
    mockRuleDebates.push(debate)
    return { code: 200, data: { debateId: debate.id } }
  }
}
