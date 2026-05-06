<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-24 | Updated: 2026-04-24 -->

# src/core/ — 架构核心层

## Purpose

整个应用的 DI 容器管理、响应式状态基类、Controller/Model/Service 基类。理解这层是理解整个项目架构的前提。

## 架构概念

```
Zone (Inversify Container 编排器)
  ├── rootContainer        全局单例 Service 绑定
  └── renderContainer      每个 RenderController 独立的子容器

BaseModel<TState, TInternalState, TEventMap, TProps>
  └── Vue Reactivity proxy (this.#internal)
  └── 对外暴露 readonly state (TState)

BaseController extends BaseModel
  └── 可注入其他 Service / Controller

BaseRenderController extends BaseController
  └── 感知 React 生命周期 (onMount / onUnmount)
  └── 感知路由焦点 (routeFocused)
  └── 持有自己的 Inversify 子容器

BaseService
  └── 无状态，通过 @service() 装饰器注册到容器
```

## 关键文件

| 文件 | 说明 |
|------|------|
| `zone/index.ts` | `Zone` 类：管理 Inversify Container 层级，创建/销毁 render 子容器 |
| `zone/@com/` | Zone 工具函数（`createZone`, `getDesignParamtypes`, `onZoneClassRegister`）|
| `models/base-model.ts` | 响应式状态基类，内部使用 Vue Reactivity proxy |
| `models/base-controller.ts` | 业务控制器基类，extends BaseModel，可注入依赖 |
| `models/base-render-controller.ts` | 页面/组件控制器基类，感知 React 生命周期和路由焦点 |
| `models/base-domain.ts` | 领域对象基类 |
| `services/base-service.ts` | Service 基类（无状态）|
| `effects/` | 副作用注册系统 |
| `reports/` | 上报/埋点基础设施 |
| `@test/` | 测试工具 |

## Zone 生命周期

```
createZone()
  └── new Zone(rootContainer)
        └── rootContainer 绑定所有 @service() 标记的 Service

页面挂载时：
  useProvideRenderController(ControllerClass)
    └── zone.createRenderContainer(parent, ControllerClass)
          └── 创建子 Container，绑定 ControllerClass
          └── controller.onMount() 触发

页面卸载时：
  └── zone.destroyRenderContainer(...)
        └── controller.onUnmount() 触发
```

## 状态访问模式

```typescript
// Controller 内部更新状态
this[BaseModel.UpdateInternalSymbol]({ key: value })

// View 层读取状态（只读）
const controller = useRenderController(MyController)
controller.state.key  // readonly，变化时自动触发 re-render
```

## For AI Agents

### 新增 Service
1. 在 `src/services/` 新建文件，class 加 `@service()` 装饰器
2. 构造函数参数为依赖注入（Inversify 自动解析）
3. 继承 `BaseService`

### 新增 RenderController（页面级）
1. 在 `src/pages/{name}/` 或 `src/components/{name}/` 新建 `{name}-controller.ts`
2. 继承 `BaseRenderController<TState, TInternalState>`
3. 定义 `getInitialInternalState()` 返回初始状态
4. 在对应 TSX 文件用 `useProvideRenderController` / `useRenderController` 绑定

### 禁止行为
- 禁止在 BaseModel 以外的地方直接操作 Vue reactive 对象
- 禁止跨 renderContainer 共享 RenderController 实例
- 禁止在 Service 中持有可变状态（Service 应无状态）

## Dependencies

### External
- `inversify` ^7 — IoC 容器
- `reflect-metadata` — 装饰器元数据
- `vue` (reactivity only) — 响应式代理

<!-- MANUAL: -->
