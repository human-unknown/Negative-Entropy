module.exports = {
  env: {
    browser: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // --- Vue 规则 ---
    // 允许单文件组件名只有一个单词（项目中有大量如 Home.vue, Admin.vue）
    'vue/multi-word-component-names': 'off',
    // 允许 v-html（但审查时需要关注 XSS 风险）
    'vue/no-v-html': 'off',
    // props 必须定义类型
    'vue/require-prop-types': 'warn',
    // emit 必须定义事件名
    'vue/require-explicit-emits': 'warn',
    // 组件 name 属性使用 PascalCase
    'vue/component-name-in-template-casing': ['warn', 'PascalCase'],

    // --- 通用 JavaScript 规则 ---
    // 生产环境不允许 console.log
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // 禁止 var，使用 let/const
    'no-var': 'error',
    // 优先使用 const（未被重新赋值的变量强制使用 const）
    'prefer-const': 'warn',
    // 禁止在条件中使用常量表达式（如 if (true)）
    'no-constant-condition': 'warn',
    // 禁止空代码块
    'no-empty': 'warn',
    // 禁止不必要的转义
    'no-useless-escape': 'warn',
    // 建议使用模板字符串
    'prefer-template': 'warn',
  },
  // 全局变量声明
  globals: {
    // ElementPlus 全局注册的组件不报未定义
    vi: 'readonly',
  },
}
