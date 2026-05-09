import { createRouter, createWebHashHistory } from 'vue-router'
import { USER_LEVEL } from '@/constants/userLevel'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresLayout: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPassword.vue'),
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue'),
    meta: { requiresAuth: true, minLevel: USER_LEVEL.BEGINNER, requiresLayout: true },
  },
  {
    path: '/check/logic',
    name: 'CheckLogic',
    component: () => import('@/views/CheckLogic.vue'),
    meta: { requiresLayout: true },
  },
  {
    path: '/check/debate',
    name: 'CheckDebate',
    component: () => import('@/views/CheckDebate.vue'),
    meta: { requiresLayout: true },
  },
  {
    path: '/check/result',
    name: 'CheckResult',
    component: () => import('@/views/CheckResult.vue'),
    meta: { requiresLayout: true },
  },
  {
    path: '/debates',
    name: 'DebateList',
    component: () => import('@/views/DebateList.vue'),
    meta: { requiresLayout: true },
  },
  {
    path: '/debates/create',
    name: 'DebateCreate',
    component: () => import('@/views/DebateCreate.vue'),
    meta: { requiresAuth: true, minLevel: USER_LEVEL.ADVANCED, requiresLayout: true },
  },
  {
    path: '/debates/flow',
    name: 'DebateFlow',
    component: () => import('@/views/DebateFlow.vue'),
    meta: { requiresAuth: true, minLevel: USER_LEVEL.BEGINNER, requiresLayout: true },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, requiresLayout: true },
  },
  {
    path: '/rules',
    name: 'RuleDebateList',
    component: () => import('@/views/RuleDebateList.vue'),
    meta: { requiresLayout: true },
  },
  {
    path: '/rules/debate/:id',
    name: 'RuleDebateDetail',
    component: () => import('@/views/RuleDebateDetail.vue'),
    meta: { requiresLayout: true },
  },
  {
    path: '/rules/history',
    name: 'RuleHistoryPage',
    component: () => import('@/views/RuleHistoryPage.vue'),
    meta: { requiresLayout: true },
  },
  // ---- 社区功能 ----
  {
    path: '/c/:slug',
    name: 'ChannelView',
    component: () => import('@/views/ChannelView.vue'),
    meta: { requiresLayout: true },
  },
  {
    path: '/p/create',
    name: 'PostCreate',
    component: () => import('@/views/PostCreate.vue'),
    meta: { requiresAuth: true, minLevel: USER_LEVEL.INTERMEDIATE, requiresLayout: true },
  },
  {
    path: '/p/:postId',
    name: 'PostDetail',
    component: () => import('@/views/PostDetail.vue'),
    meta: { requiresLayout: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()

  // 严格校验：需要认证的路由必须有 token 和 user
  if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn) {
      userStore.logout()
      return next('/')
    }
  }

  // 严格校验：管理员权限
  if (to.meta.requiresAdmin) {
    if (!userStore.isAdmin) {
      console.warn('权限不足：需要管理员权限')
      return next('/')
    }
  }

  // 严格校验：等级权限
  if (to.meta.minLevel) {
    if (userStore.userLevel < to.meta.minLevel) {
      console.warn(
        `权限不足：需要等级 ${to.meta.minLevel}，当前等级 ${userStore.userLevel}`,
      )
      return next('/')
    }
  }

  next()
})

export default router
