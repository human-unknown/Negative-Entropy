import { createRouter, createWebHashHistory } from 'vue-router'
import { USER_LEVEL } from '@/constants/userLevel'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPassword.vue')
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue'),
    meta: { requiresAuth: true, minLevel: USER_LEVEL.BEGINNER }
  },
  {
    path: '/check/logic',
    name: 'CheckLogic',
    component: () => import('@/views/CheckLogic.vue')
  },
  {
    path: '/check/debate',
    name: 'CheckDebate',
    component: () => import('@/views/CheckDebate.vue')
  },
  {
    path: '/check/result',
    name: 'CheckResult',
    component: () => import('@/views/CheckResult.vue')
  },
  {
    path: '/debates',
    name: 'DebateList',
    component: () => import('@/views/DebateList.vue')
  },
  {
    path: '/debates/create',
    name: 'DebateCreate',
    component: () => import('@/views/DebateCreate.vue'),
    meta: { requiresAuth: true, minLevel: USER_LEVEL.ADVANCED }
  },
  {
    path: '/debates/flow',
    name: 'DebateFlow',
    component: () => import('@/views/DebateFlow.vue'),
    meta: { requiresAuth: true, minLevel: USER_LEVEL.BEGINNER }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/rules',
    name: 'RuleDebateList',
    component: () => import('@/views/RuleDebateList.vue')
  },
  {
    path: '/rules/debate/:id',
    name: 'RuleDebateDetail',
    component: () => import('@/views/RuleDebateDetail.vue')
  },
  {
    path: '/rules/history',
    name: 'RuleHistoryPage',
    component: () => import('@/views/RuleHistoryPage.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  
  // 严格校验：需要认证的路由必须有token和user
  if (to.meta.requiresAuth) {
    if (!token || !user) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return next('/')
    }
  }
  
  // 严格校验：管理员权限
  if (to.meta.requiresAdmin) {
    if (!user || user.level !== USER_LEVEL.ADMIN) {
      console.warn('权限不足：需要管理员权限')
      return next('/')
    }
  }
  
  // 严格校验：等级权限
  if (to.meta.minLevel) {
    if (!user || user.level < to.meta.minLevel) {
      console.warn(`权限不足：需要等级 ${to.meta.minLevel}，当前等级 ${user?.level || 0}`)
      return next('/debates')
    }
  }
  
  next()
})

export default router
