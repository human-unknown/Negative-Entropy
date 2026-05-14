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
  created_at: new Date().toISOString(),
})

let mockDebates = []
let mockSpeeches = []
const mockVotes = []
let currentUserId = null

// ---- 社区 Mock 数据 ----
let mockPosts = []
let mockComments = []

const mockChannels = [
  {
    id: 1,
    name: '科技',
    slug: 'tech',
    description: '技术、科学、AI等理性讨论',
    icon: '🔬',
    post_count: 0,
  },
  {
    id: 2,
    name: '哲学',
    slug: 'philosophy',
    description: '形而上学、伦理学、逻辑学',
    icon: '💭',
    post_count: 0,
  },
  {
    id: 3,
    name: '经济',
    slug: 'economics',
    description: '市场、政策、行为经济学',
    icon: '📊',
    post_count: 0,
  },
  {
    id: 4,
    name: '社会',
    slug: 'society',
    description: '公共议题、社会现象分析',
    icon: '🏛️',
    post_count: 0,
  },
  {
    id: 5,
    name: '综合',
    slug: 'general',
    description: '无法归类的严肃讨论',
    icon: '💬',
    post_count: 0,
  },
]

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
      pro_limit: 5,
      con_limit: 5,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      pro_count: 8,
      con_count: 7,
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
      pro_limit: 5,
      con_limit: 5,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      pro_count: 12,
      con_count: 11,
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
      pro_limit: 5,
      con_limit: 5,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      pro_count: 3,
      con_count: 2,
    },
  ]

  mockSpeeches = [
    {
      id: 1,
      topic_id: 1,
      user_id: 1,
      user_name: '张三',
      stance: 1,
      content: 'AI确实会取代部分重复性工作，但同时也会创造新的就业机会',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 2,
      topic_id: 1,
      user_id: 2,
      user_name: '李四',
      stance: 0,
      content: '人类的创造力和情感是AI无法替代的核心竞争力',
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ]
}

initMockData()

// 初始化社区 Mock 数据
const initMockPosts = () => {
  mockPosts = [
    {
      id: 1,
      channel_id: 1,
      author_id: 1,
      author_name: '张三',
      author_level: 3,
      quality_score: 8.5,
      channel_name: '科技',
      channel_slug: 'tech',
      channel_icon: '🔬',
      title: '大语言模型的推理能力是否被高估了？',
      content:
        '最近GPT-5发布后，很多人认为AGI已经近在咫尺。但我认为我们需要更冷静地看待LLM的推理能力。当前模型在模式匹配上表现出色，但在需要真正的因果推理时仍然存在明显缺陷...',
      thesis: 'LLM的推理能力被严重高估，其本质仍是统计模式匹配',
      sources: [{ url: 'https://arxiv.org/abs/xxx', title: '论文标题', note: '相关研究' }],
      comment_count: 8,
      view_count: 234,
      is_pinned: false,
      status: 0,
      audit_status: 1,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 2,
      channel_id: 4,
      author_id: 2,
      author_name: '李四',
      author_level: 2,
      quality_score: 7.2,
      channel_name: '社会',
      channel_slug: 'society',
      channel_icon: '🏛️',
      title: '最低工资标准提高对就业市场的实际影响分析',
      content:
        '基于过去五年中国各省市最低工资调整的数据，我们其实可以看到一些反直觉的现象。最低工资的提升并没有像某些经济学家预测的那样导致大规模失业...',
      thesis: null,
      sources: [],
      comment_count: 15,
      view_count: 567,
      is_pinned: false,
      status: 0,
      audit_status: 1,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 3,
      channel_id: 2,
      author_id: 3,
      author_name: '王五',
      author_level: 4,
      quality_score: 9.1,
      channel_name: '哲学',
      channel_slug: 'philosophy',
      channel_icon: '💭',
      title: '自由意志存在吗？——从决定论到相容论',
      content:
        '自由意志问题困扰了哲学家几个世纪。本文将从强决定论、自由意志论和相容论三个角度来审视这个问题。相容论可能是最有希望调和现代科学与道德责任的立场...',
      thesis: '相容论是调和决定论与道德责任的最佳框架',
      sources: [
        {
          url: 'https://plato.stanford.edu/entries/compatibilism/',
          title: 'SEP: Compatibilism',
          note: '权威哲学参考',
        },
      ],
      comment_count: 23,
      view_count: 891,
      is_pinned: true,
      status: 0,
      audit_status: 1,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 4,
      channel_id: 1,
      author_id: 1,
      author_name: '张三',
      author_level: 3,
      quality_score: 6.8,
      channel_name: '科技',
      channel_slug: 'tech',
      channel_icon: '🔬',
      title: '量子计算离实用化还有多远？',
      content:
        '最近IBM和Google在量子比特数量上取得了突破，但从NISQ时代到容错量子计算，我们可能还需要至少十年。本文将分析当前的主要技术瓶颈...',
      thesis: '量子计算的实用化至少还需要十年',
      sources: [],
      comment_count: 5,
      view_count: 320,
      is_pinned: false,
      status: 0,
      audit_status: 1,
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 5,
      channel_id: 3,
      author_id: 2,
      author_name: '李四',
      author_level: 2,
      quality_score: null,
      channel_name: '经济',
      channel_slug: 'economics',
      channel_icon: '📊',
      title: '通货膨胀的本质：货币现象还是供给问题？',
      content:
        '关于通胀的争论从未停止。货币主义学派认为通胀始终是一种货币现象，但近年来的供应链危机似乎提供了一个反例。让我们用数据和理论来审视这个问题...',
      thesis: null,
      sources: [],
      comment_count: 2,
      view_count: 98,
      is_pinned: false,
      status: 0,
      audit_status: 1,
      created_at: new Date(Date.now() - 259200000).toISOString(),
    },
  ]

  // 更新频道帖子计数
  mockChannels.forEach((ch) => {
    ch.post_count = mockPosts.filter((p) => p.channel_id === ch.id).length
  })

  // 初始化评论
  mockComments = [
    {
      id: 1,
      post_id: 1,
      author_id: 2,
      author_name: '李四',
      author_level: 2,
      parent_id: null,
      content:
        '很好的分析。不过我认为模式匹配和推理能力之间的界限本身就比较模糊。人类的很多推理本质上也是模式匹配。',
      upvote_count: 12,
      is_deleted: 0,
      audit_status: 1,
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 2,
      post_id: 1,
      author_id: 3,
      author_name: '王五',
      author_level: 4,
      parent_id: 1,
      content:
        '同意。从认知科学的角度看，人类推理确实大量依赖类比（模式匹配），关键区别在于元认知层面的自我纠错能力。',
      upvote_count: 8,
      is_deleted: 0,
      audit_status: 1,
      created_at: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: 3,
      post_id: 3,
      author_id: 1,
      author_name: '张三',
      author_level: 3,
      parent_id: null,
      content:
        '推荐丹尼特的《自由的进化》，对相容论有很好的阐释。你引用的SEP条目也是非常好的起点。',
      upvote_count: 5,
      is_deleted: 0,
      audit_status: 1,
      created_at: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: 4,
      post_id: 3,
      author_id: 2,
      author_name: '李四',
      author_level: 2,
      parent_id: null,
      content:
        '作为非决定论者，我认为量子力学的不确定性为自由意志提供了物理基础。相容论虽然实用，但回避了核心问题。',
      upvote_count: 3,
      is_deleted: 0,
      audit_status: 1,
      created_at: new Date(Date.now() - 21600000).toISOString(),
    },
  ]
}
initMockPosts()

// 通知 Mock 数据
let mockNotificationId = 0
let mockNotifications = []
const initMockNotifications = () => {
  mockNotifications = [
    {
      id: ++mockNotificationId,
      type: 'debate_settled',
      content: 'AI是否会取代人类工作辩论已结算',
      is_read: 0,
      created_at: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: ++mockNotificationId,
      type: 'debate_reply',
      content: '李四回复了你在"远程办公"中的发言',
      is_read: 0,
      created_at: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: ++mockNotificationId,
      type: 'vote_result',
      content: '你参与的"传统文化"辩论投票已完成',
      is_read: 1,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: ++mockNotificationId,
      type: 'system',
      content: '欢迎加入逆熵，请完善个人资料',
      is_read: 0,
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: ++mockNotificationId,
      type: 'punishment',
      content: '您的发言因违规被系统警告',
      is_read: 1,
      created_at: new Date(Date.now() - 259200000).toISOString(),
    },
    // 社区通知
    {
      id: ++mockNotificationId,
      type: 'comment_reply',
      content: '王五回复了你的评论',
      is_read: 0,
      created_at: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: ++mockNotificationId,
      type: 'post_scored',
      content: '你的帖子"大语言模型的推理能力"获得了 8.5 分',
      is_read: 0,
      created_at: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: ++mockNotificationId,
      type: 'debate_started',
      content: '你的帖子已升级为辩论',
      is_read: 1,
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ]
}
initMockNotifications()

let mockRules = null
const mockRuleDebates = []
let currentRuleDebateId = 0

const getMockRules = () => {
  if (mockRules) return mockRules
  mockRules = [
    {
      id: 1,
      title: '辩论发言规则',
      content: '每位辩手单次发言字数10-500字，发言间隔60秒',
      version: 2,
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: '投票权重规则',
      content: '普通用户权重1.0，进阶用户1.0，资深用户1.5，管理员2.0',
      version: 1,
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      title: '用户等级规则',
      content: '入门(1)、进阶(2)、资深(3)、管理员(4)，通过逻辑测试和辩论考核可升级',
      version: 3,
      updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
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
      created_at: new Date().toISOString(),
    }
    mockUsers.push(user)
    return { code: 200, data: { userId }, message: '注册成功' }
  },

  // 登录
  login: async (data) => {
    const user = mockUsers.find((u) => u.phone === data.account || u.email === data.account)
    if (!user) {
      const newUser = {
        id: mockUsers.length + 1,
        name: '测试用户',
        phone: data.account,
        level: 2,
        exp: 150,
        created_at: new Date().toISOString(),
      }
      mockUsers.push(newUser)
      currentUserId = newUser.id
      return {
        code: 200,
        data: {
          token: `mock-token-${newUser.id}`,
          user: newUser,
        },
      }
    }
    currentUserId = user.id
    return {
      code: 200,
      data: {
        token: `mock-token-${user.id}`,
        user,
      },
    }
  },

  // 获取辩论列表
  getDebateList: async (params) => {
    let list = [...mockDebates]

    if (params.category) {
      list = list.filter((d) => d.category === params.category)
    }

    if (params.keyword) {
      list = list.filter(
        (d) => d.title.includes(params.keyword) || d.description.includes(params.keyword),
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
        total: list.length,
      },
    }
  },

  // 获取辩论详情
  getDebateDetail: async (topicId) => {
    const debate = mockDebates.find((d) => d.id === parseInt(topicId))
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
      con_count: 0,
    }
    mockDebates.unshift(newDebate)
    return { code: 200, data: { topicId: newDebate.id } }
  },

  // 加入辩论
  joinDebate: async (topicId, stance) => {
    const debate = mockDebates.find((d) => d.id === parseInt(topicId))
    if (debate) {
      debate.participant_count++
      if (stance === 1) debate.pro_count++
      else debate.con_count++
    }
    return { code: 200, message: '加入成功' }
  },

  // 获取发言列表
  getSpeeches: async (topicId, role) => {
    let list = mockSpeeches.filter((s) => s.topic_id === parseInt(topicId))
    if (role) {
      list = list.filter((s) => s.stance === parseInt(role))
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
      created_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
    }
    mockVotes.push(vote)
    return { code: 200, message: '投票成功' }
  },

  // 获取用户信息
  getUserInfo: async () => {
    const user = mockUsers.find((u) => u.id === currentUserId) || {
      id: 1,
      name: '测试用户',
      level: 2,
      exp: 150,
      phone: '13800138000',
    }
    return { code: 200, data: user }
  },

  // 获取逻辑测试题目
  getLogicTest: async () => {
    return {
      code: 200,
      data: {
        questions: [
          {
            question: '如果所有A都是B，所有B都是C，那么所有A都是C',
            options: ['正确', '错误', '无法判断'],
          },
          {
            question: '张三比李四高，李四比王五高，那么张三比王五高',
            options: ['正确', '错误', '无法判断'],
          },
          {
            question: '有些猫是黑色的，所有黑色的动物都怕光，因此有些猫怕光',
            options: ['正确', '错误', '无法判断'],
          },
          {
            question: '如果下雨，地面就会湿。地面湿了，所以下雨了',
            options: ['正确', '错误', '无法判断'],
          },
          {
            question: '所有程序员都会编程，小明会编程，所以小明是程序员',
            options: ['正确', '错误', '无法判断'],
          },
        ],
      },
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
    const topics = [
      '人工智能是否会取代人类工作',
      '远程办公是否应该成为常态',
      '传统文化在现代社会是否还有价值',
    ]
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
        debateScore: 78,
      },
    }
  },

  // 规则管理
  getRules: async () => {
    return { code: 200, data: { list: getMockRules() } }
  },

  saveRule: async (data) => {
    const rules = getMockRules()
    const idx = rules.findIndex((r) => r.id === data.id)
    if (idx >= 0) {
      rules[idx] = {
        ...rules[idx],
        ...data,
        updated_at: new Date().toISOString(),
        version: rules[idx].version + 1,
      }
    } else {
      const newRule = {
        ...data,
        id: rules.length + 1,
        version: 1,
        updated_at: new Date().toISOString(),
      }
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
      no_count: 0,
    }
    mockRuleDebates.push(debate)
    return { code: 200, data: { debateId: debate.id } }
  },

  // ---- 通知系统 ----

  // 获取通知列表
  getNotifications: async (params) => {
    const page = params?.page || 1
    const limit = params?.limit || 10
    let list = [...mockNotifications]
    if (params?.unreadOnly === 'true' || params?.unreadOnly === '1') {
      list = list.filter((n) => n.is_read === 0)
    }
    const start = (page - 1) * limit
    const end = start + limit
    return { code: 200, data: { list: list.slice(start, end), total: list.length, page, limit } }
  },

  // 获取未读数量
  getUnreadCount: async () => {
    const count = mockNotifications.filter((n) => n.is_read === 0).length
    return { code: 200, data: { count } }
  },

  // 标记单条已读
  markAsRead: async (id) => {
    const item = mockNotifications.find((n) => n.id === parseInt(id))
    if (item) item.is_read = 1
    return { code: 200, message: '已标记为已读' }
  },

  // 标记全部已读
  markAllAsRead: async () => {
    mockNotifications.forEach((n) => {
      n.is_read = 1
    })
    return { code: 200, message: '全部标记为已读' }
  },

  // ---- 用户数据 ----

  // 获取我的辩论列表
  getUserDebates: async (params) => {
    const page = params?.page || 1
    const limit = params?.limit || 10
    const list = mockDebates.map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
      stance: d.id % 2 === 0 ? 1 : 0,
      created_at: d.created_at,
      winner: d.status === 2 ? (d.id % 2 === 0 ? 'pro' : 'con') : null,
    }))
    const start = (page - 1) * limit
    const end = start + limit
    return { code: 200, data: { debates: list.slice(start, end), total: list.length, page, limit } }
  },

  // 获取经验记录
  getExpHistory: async (params) => {
    const page = params?.page || 1
    const limit = params?.limit || 20
    const entries = [
      {
        id: 1,
        exp: 50,
        reason: '辩论结算奖励',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 2,
        exp: 20,
        reason: '发言奖励',
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 3,
        exp: -10,
        reason: '违规扣分',
        created_at: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: 4,
        exp: 30,
        reason: '逻辑测试通过',
        created_at: new Date(Date.now() - 345600000).toISOString(),
      },
    ]
    const start = (page - 1) * limit
    const end = start + limit
    return {
      code: 200,
      data: { list: entries.slice(start, end), total: entries.length, page, limit },
    }
  },

  // 获取等级信息
  getLevelInfo: async () => {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : { level: 1, exp: 0 }
    return {
      code: 200,
      data: {
        level: user.level,
        exp: user.exp,
        currentThreshold: 0,
        nextThreshold: user.level >= 3 ? null : user.level === 1 ? 500 : 1000,
        nextLevelName: user.level >= 3 ? null : user.level === 1 ? '进阶级' : '资深级',
        progress:
          user.level >= 3
            ? 100
            : Math.min(Math.round((user.exp / (user.level === 1 ? 500 : 1000)) * 100), 100),
      },
    }
  },

  // ---- 结构化辩论轮次 API ----
  getCurrentRound: async () => {
    // 普通辩论没有模板，返回 isFreeDebate: true
    return { code: 200, data: { isFreeDebate: true } }
  },
  getRounds: async () => {
    return { code: 200, data: [] }
  },
  submitRound: async () => {
    return { code: 200, data: {}, message: '发言已提交' }
  },
  skipRound: async () => {
    return { code: 200, data: {}, message: '已跳过该轮次' }
  },
  getScoreResult: async () => {
    return { code: 404, message: '辩论结果不存在' }
  },
  submitScore: async () => {
    return { code: 200, message: '评分已提交' }
  },

  // ======== 社区 Mock API ========

  getChannels: async () => {
    return { code: 200, data: mockChannels }
  },

  getPosts: async (params) => {
    let list = [...mockPosts]
    if (params?.channel) {
      list = list.filter((p) => p.channel_slug === params.channel)
    }
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase()
      list = list.filter(
        (p) => p.title.toLowerCase().includes(kw) || p.content.toLowerCase().includes(kw),
      )
    }
    if (params?.sort === 'newest') {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (params?.sort === 'hot') {
      list.sort(
        (a, b) =>
          b.comment_count * 2 + b.view_count * 0.1 - (a.comment_count * 2 + a.view_count * 0.1),
      )
    } else {
      // quality sort (default): pinned first, then by quality_score desc
      list.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return (b.quality_score || 0) - (a.quality_score || 0)
      })
    }
    const page = parseInt(params?.page) || 1
    const limit = parseInt(params?.limit) || 20
    const start = (page - 1) * limit
    return {
      code: 200,
      data: {
        posts: list.slice(start, start + limit),
        total: list.length,
        page,
        limit,
        hasMore: start + limit < list.length,
      },
    }
  },

  getPostDetail: async (postId) => {
    const post = mockPosts.find((p) => p.id === parseInt(postId))
    if (!post) return { code: 404, message: '帖子不存在' }
    post.view_count++
    return { code: 200, data: post }
  },

  createPost: async (data) => {
    const id = mockPosts.length + 1
    const channel = mockChannels.find((c) => c.id === data.channel_id) || mockChannels[4]
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : { name: '当前用户', level: 2 }
    const newPost = {
      id,
      channel_id: data.channel_id,
      author_id: currentUserId || 1,
      author_name: user.name,
      author_level: user.level || 2,
      channel_name: channel.name,
      channel_slug: channel.slug,
      channel_icon: channel.icon,
      title: data.title,
      content: data.content,
      thesis: data.thesis || null,
      premises: data.premises || null,
      sources: data.sources || null,
      comment_count: 0,
      view_count: 0,
      quality_score: null,
      is_pinned: false,
      status: 0,
      audit_status: 1,
      created_at: new Date().toISOString(),
    }
    mockPosts.unshift(newPost)
    channel.post_count++
    return { code: 200, data: newPost, message: '发帖成功' }
  },

  updatePost: async (postId, data) => {
    const post = mockPosts.find((p) => p.id === parseInt(postId))
    if (!post) return { code: 404, message: '帖子不存在' }
    Object.assign(post, data)
    return { code: 200, data: post, message: '编辑成功' }
  },

  deletePost: async () => {
    return { code: 200, message: '删除成功' }
  },

  togglePin: async (postId) => {
    const post = mockPosts.find((p) => p.id === parseInt(postId))
    if (!post) return { code: 404, message: '帖子不存在' }
    post.is_pinned = !post.is_pinned
    return {
      code: 200,
      data: { is_pinned: post.is_pinned },
      message: post.is_pinned ? '已置顶' : '已取消置顶',
    }
  },

  startDebateFromPost: async (postId) => {
    const post = mockPosts.find((p) => p.id === parseInt(postId))
    if (!post) return { code: 404, message: '帖子不存在' }
    const debateId = mockDebates.length + 1
    const newDebate = {
      id: debateId,
      title: `[辩论] ${post.title}`,
      description: post.content,
      category: post.channel_slug,
      status: 0,
      publisher_id: currentUserId,
      publisher_name: '当前用户',
      participant_count: 0,
      heat: 0,
      pro_limit: 5,
      con_limit: 5,
      created_at: new Date().toISOString(),
      pro_count: 0,
      con_count: 0,
      post_id: post.id,
    }
    mockDebates.unshift(newDebate)
    post.debate_id = debateId
    return { code: 200, data: newDebate, message: '辩论已创建' }
  },

  scorePost: async (postId, data) => {
    const post = mockPosts.find((p) => p.id === parseInt(postId))
    if (!post) return { code: 404, message: '帖子不存在' }
    const { logic, evidence, expression, depth } = data
    const avg = (logic + evidence + expression + depth) / 4
    post.quality_score =
      post.quality_score !== null
        ? Math.round(((post.quality_score + avg) / 2) * 100) / 100
        : Math.round(avg * 100) / 100
    return { code: 200, data: { quality_score: post.quality_score }, message: '评分成功' }
  },

  getComments: async (postId) => {
    const list = mockComments.filter((c) => c.post_id === parseInt(postId) && !c.is_deleted)
    return { code: 200, data: { comments: list, total: list.length } }
  },

  createComment: async (postId, data) => {
    const id = mockComments.length + 1
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : { name: '当前用户', level: 2 }
    const comment = {
      id,
      post_id: parseInt(postId),
      author_id: currentUserId || 1,
      author_name: user.name,
      author_level: user.level || 2,
      parent_id: data.parent_id || null,
      content: data.content,
      upvote_count: 0,
      is_deleted: 0,
      audit_status: 1,
      created_at: new Date().toISOString(),
    }
    mockComments.push(comment)
    const post = mockPosts.find((p) => p.id === parseInt(postId))
    if (post) post.comment_count++
    return { code: 200, data: comment, message: '评论成功' }
  },

  deleteComment: async () => {
    return { code: 200, message: '删除成功' }
  },

  upvoteComment: async (commentId) => {
    const comment = mockComments.find((c) => c.id === parseInt(commentId))
    if (!comment) return { code: 404, message: '评论不存在' }
    comment.upvote_count++
    return { code: 200, data: { upvote_count: comment.upvote_count } }
  },
}
