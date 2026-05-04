# PR Review #001: SpeechInput.vue 组件审查

> **审查日期**: 2026-05-03
> **审查者**: WorkBuddy（模拟资深开发身份）
> **观察者**: 待安排的初级开发者
> **审查范围**: `frontend/src/components/SpeechInput.vue` + `frontend/src/api/debate.js`
> **变更类型**: 新功能（辩论发言输入组件）

---

## 审查摘要

| 指标 | 结果 |
|------|------|
| 总代码行数 | 178 行（模板 28 + 脚本 56 + 样式 94） |
| 发现 Blocker | 0 |
| 发现 Major | 2 |
| 发现 Minor | 3 |
| 发现 Nitpick | 2 |
| **整体评价** | ⚠️ 需要修改后合并 |

---

## 逐行审查记录

### 🔴 P0 Blocker（无）

未发现阻塞性问题。

---

### 🟠 P1 Major（2 个）

#### M1. handleSubmit 中缺少用户错误反馈（第 77 行）

```javascript
// 第 66-81 行
const handleSubmit = async () => {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    await createSpeech(props.topicId, content.value)
    ElMessage.success('发言已提交，等待审核')
    content.value = ''
    startCooldown()
    emit('submitted')
  } catch (err) {
    console.error(err)  // ← 这里
  } finally {
    submitting.value = false
  }
}
```

**问题**: catch 块只做了 `console.error(err)`，用户完全不知道请求失败了。
如果网络超时、服务器返回 500，用户看到的只是 submitting 状态闪一下恢复，会以为提交成功了。

**建议修复**:
```javascript
  } catch (err) {
    console.error('发言提交失败:', err)
    const msg = err?.response?.data?.message || '发言提交失败，请稍后重试'
    ElMessage.error(msg)
  } finally {
```

**严重级别**: 🟠 P1 Major — 直接影响用户体验和数据完整性（用户可能重复尝试）

---

#### M2. 发言冷却定时器在组件卸载后的潜在问题（第 56-64 行）

```javascript
const startCooldown = () => {
  cooldown.value = 60
  timer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}
```

**问题**: 定时器回调中 `cooldown.value` 递减时没有检查组件是否已卸载。
虽然 `onUnmounted` 会清理，但如果用户在冷却期间快速导航离开再回来，
旧的定时器 ID 可能被 `timer` 变量覆盖（因为组件重新挂载后 timer 重新声明），
导致旧的定时器无法被清理（内存泄漏）。

**建议修复**:
```javascript
const startCooldown = () => {
  cooldown.value = 60
  const _timer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      clearInterval(_timer)
    }
  }, 1000)
  timer = _timer
}
```

**严重级别**: 🟠 P1 Major — 极端情况下可能造成内存泄漏和意外的状态更新

---

### 🟡 P2 Minor（3 个）

#### m3. HTML void elements 自闭合（第 9、15、20 行）

```html
<textarea ... />
<button ... >
</button>
```

`textarea` 不是 void element，不应对其使用自闭合语法（虽然 Vue 3 编译器能处理，
但不符合 HTML 规范和 `vue/html-self-closing` 标准）。

**建议**: `<textarea ...></textarea>`

---

#### m4. Button 缺少 type 属性（第 20 行）

```html
<button :disabled="!canSubmit" @click="handleSubmit">
```

虽然不在 `<form>` 内，但建议显式指定 `type="button"` 以避免将来放入表单时的意外提交行为。

**严重级别**: 🟡 P2 Minor — 当前无风险，但属于防御性编程

---

#### m5. .warning 类样式依赖 Magic Number（第 5、115 行）

```html
:class="['word-count', { warning: content.length > 450 }]"
```

`450` 是"字数接近上限"阈值，但硬编码在模板中。
如果未来修改 500 字限制，还要记得同步改 450。

**建议**: 定义为 `computed` 或在组件顶部定义常量。

```javascript
const MAX_LENGTH = 500
const WARNING_THRESHOLD = MAX_LENGTH * 0.9

// 模板中
warning: content.length > WARNING_THRESHOLD
```

---

### ⚪ P3 Nitpick（2 个）

#### n6. Template 属性顺序不一致（第 20-22 行）

```html
<button 
  :disabled="!canSubmit"
  @click="handleSubmit"
>
```

与其他 Vue 组件的惯例相比，`@click` 通常在 `:disabled` 之前。
建议统一为：`v-model` / `v-if` → `@event` → `:prop` → `class/style`。

---

#### n7. `onUnmounted` 清理逻辑可以合并到 `startCooldown` 中（第 83 行）

当前 `onUnmounted` 只做了一件事：清理 timer。如果组件增加其他清理逻辑，
分散在多个地方。建议统一到一个 cleanup 函数。

---

## 安全检查清单 ✅

- [x] Props 定义了类型和 default/required
- [x] Emits 明确定义事件名
- [x] 组件使用 `<style scoped>` — 样式不污染全局
- [x] 冷却定时器在 `onUnmounted` 中清理
- [x] 无 `v-html` 使用 — 无 XSS 风险
- [x] 模板无复杂表达式——提取为 computed
- [x] API 调用通过封装层，不在组件中直接调用 Axios

## 代码规范检查清单 ✅

- [x] 单文件职责单一
- [x] 函数不超过 50 行
- [x] 条件嵌套不超过 3 层
- [x] 命名规范（camelCase）

---

## 审查结论

### 修复要求

| 级别 | 数量 | 必须修复 |
|------|------|---------|
| P0 Blocker | 0 | — |
| P1 Major | 2 | ✅ 必须修复 |
| P2 Minor | 3 | 建议修复 |
| P3 Nitpick | 2 | 可选 |

### 通过条件

- [ ] P1 Major 已修复（M1, M2）
- [ ] 修复后重新运行 `npm run lint` 通过
- [ ] 至少 1 个 Approval

**结论**: ⚠️ **不通过，需要修改后重新审查**

---

## 审查者注释（内部）

**写给观察者（初级开发者）**：
- 重点看 M1：这是前端开发中最常见的问题之一——错误处理不完整。
  用户操作的反馈闭环必须完整：成功 → 告知用户、失败 → 告知用户原因。
- M2 是"副作用清理"的经典案例。Vue 3 Composition API 中，
  定时器、事件监听、WebSocket 等都需要在 `onUnmounted` 中清理。
- 不要把"这个能工作"等同于"这个写得好"——可维护性往往藏在细节中。

---

*审查依据: CODE_REVIEW_STANDARDS.md v1.0*
