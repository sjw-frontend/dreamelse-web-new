<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-24 | Updated: 2026-04-24 -->

# src/hooks/ — React Hooks 层

## Purpose

桥接 DI 层（Inversify / Zone）与 React 渲染层的自定义 Hook。让 React 组件能够以 hooks 方式使用 Controller / Service / 响应式状态，而无需直接操作 Inversify 容器。

## Hook 清单

### Zone / DI 相关（核心）
| 文件 | 说明 |
|------|------|
| `use-zone.ts` | 从 React Context 获取当前 `Zone` 实例 |
| `use-zone-controller.ts` | 从 Zone 获取指定 Controller 实例（跨页面共享）|
| `use-render-controller.ts` | 获取当前页面/组件的 RenderController 实例 |
| `use-provide-render-controller.ts` | 在组件树顶层创建并提供 RenderController |
| `use-inject-render-controller.ts` | 在子组件中注入父级提供的 RenderController |
| `use-register-render-controller.tsx` | 完整注册 RenderController 生命周期 |
| `use-render-controller-pointer.ts` | 获取 RenderController 的轻量指针（避免全量订阅）|
| `use-render-controller-with-condition.ts` | 条件性获取 RenderController |
| `use-render-controller-effect.ts` | 在 Controller 挂载/卸载时执行副作用 |
| `use-render-controller-effect-with-condition.tsx` | 条件性 Controller 副作用 |

### 响应式状态
| 文件 | 说明 |
|------|------|
| `use-reactive.ts` | 将 Vue Reactivity 对象接入 React 渲染（核心桥接）|
| `use-watch.ts` | 监听响应式值变化，类似 Vue `watch` |
| `use-listen-event.ts` | 监听 Controller 发出的事件 |

### UI / 交互
| 文件 | 说明 |
|------|------|
| `use-popup.ts` | 触发全局 Dialog / BottomSheet |
| `use-keyboard.ts` | 监听软键盘弹出/收起 |
| `use-styles.ts` | 动态样式计算（主题、设备适配）|
| `use-animation-driver.ts` | 统一动画驱动（Reanimated）|
| `use-navbar-rect-state.ts` | 获取导航栏尺寸信息 |
| `use-safe-layout-insets.ts` | 安全区域 insets（刘海/Home bar）|
| `use-ref-factory.ts` | 带工厂函数的 useRef（避免重复初始化）|

### 工具 / 能力
| 文件 | 说明 |
|------|------|
| `use-router.ts` | 页面跳转 hook（封装 RouterService）|
| `use-device.ts` | 设备信息（屏幕尺寸、平台、型号）|
| `use-i18n.tsx` | 国际化翻译 hook |
| `use-report.ts` | 埋点上报 hook |

## 核心用法

### 页面绑定 RenderController
```typescript
// 在页面根组件使用
const controller = useProvideRenderController(MyPageController)

// 在子组件使用父级 Controller
const controller = useInjectRenderController(MyPageController)
```

### 读取响应式状态
```typescript
// Controller 继承 BaseRenderController 后，state 已是响应式
// View 直接读取 controller.state.xxx 即可触发 re-render
// useReactive 在内部自动处理订阅
```

### 跨页面共享 Controller
```typescript
// 获取 Zone 级别的 Controller（整个应用共享）
const characterController = useZoneController(CharacterController)
```

## For AI Agents

### 新增 Hook
- 放在 `hooks/` 根目录，命名 `use-{feature}.ts`
- 在 `hooks/index.ts` 导出
- 与业务强相关的 hook 可放在 `pages/{name}/` 或 `components/{name}/` 内部

### 禁止行为
- 不在 hook 内直接操作 Vue reactive 对象（通过 Controller 方法修改）
- 不在 hook 内持有大量状态（状态归属 Controller）

<!-- MANUAL: -->
