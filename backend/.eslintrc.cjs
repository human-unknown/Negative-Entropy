module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // --- Node.js / Express 规则 ---
    // 控制台日志在服务器端允许（作为主要日志手段）
    'no-console': 'off',
    // 未使用变量：忽略以下划线开头的参数
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    // 禁止 var
    'no-var': 'error',
    // 优先使用 const
    'prefer-const': 'warn',
    // 禁止条件常量
    'no-constant-condition': 'warn',
    // 禁止空代码块
    'no-empty': 'warn',
    // 禁止不必要的转义
    'no-useless-escape': 'warn',
    // 建议使用模板字符串
    'prefer-template': 'warn',
    // 强制使用 === 和 !==
    'eqeqeq': ['error', 'always'],
    // 禁止在 return 之后有不可达代码
    'no-unreachable': 'error',
    // 回调嵌套深度警告
    'max-nested-callbacks': ['warn', 4],
    // 函数最大复杂度
    'complexity': ['warn', 15],
  },
}
