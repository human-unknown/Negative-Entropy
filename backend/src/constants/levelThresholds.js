// 等级升级阈值
export const LEVEL_THRESHOLDS = {
  1: 0,      // 入门级
  2: 500,    // 进阶级
  3: 2000,   // 资深级
  4: 5000    // 管理员级
}

// 等级权限
export const LEVEL_PERMISSIONS = {
  1: ['debate_participate'],           // 入门：只能参与
  2: ['debate_participate'],           // 进阶：只能参与
  3: ['debate_participate', 'debate_create'],  // 资深：可发布话题
  4: ['debate_participate', 'debate_create', 'content_review', 'user_manage']  // 管理员：全部权限
}
