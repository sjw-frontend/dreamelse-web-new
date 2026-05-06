<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-24 | Updated: 2026-04-24 -->

# src/controllers/ — 业务控制器层

## Purpose

持有应用核心业务状态和逻辑的 Controller 集合。通过 Inversify 注入 Service，被 RenderController（页面）或其他 Controller 使用。这里的 Controller **跨页面共享**，生命周期绑定到 Zone（应用级）。

## 与 pages/ 中 Controller 的区别

| 位置 | 类型 | 生命周期 | 用途 |
|------|------|----------|------|
| `src/controllers/` | BaseController | Zone 级（应用级别）| 跨页面共享的业务状态 |
| `src/pages/{name}/` | BaseRenderController | 页面级 | 单个页面的 UI 状态 |

## 子模块

| 目录 | 业务域 | 核心状态/功能 |
|------|--------|--------------|
| `app/` | 应用生命周期 | 初始化流程、登录态、全局配置 |
| `character/` | 角色管理 | 当前角色信息、角色列表、收藏状态、图鉴数据 |
| `script/` | 剧本管理 | 剧本列表、草稿、收藏、角色分配 |
| `dramatize/` | 演绎引擎 | 演绎会话状态、进度、音频/画面同步 |
| `router/` | 导航 | 路由跳转、参数传递、返回栈管理 |
| `world-line/` | 世界线 | 动态时间线聚合、内容流 |
| `device/` | 设备 | 设备信息、平台判断、安全区域 |
| `user/` | 用户 | 当前用户信息、登录状态、token 管理 |
| `permission/` | 权限 | 相机/麦克风/相册权限状态与请求 |

## 关键依赖关系

```
AppController
  └── 依赖 UserController（登录态）
  └── 依赖 RouterController（初始跳转）

CharacterController
  └── 依赖 ApiService（角色数据）
  └── 依赖 DataStoreService（本地缓存）

ScriptController
  └── 依赖 ApiService（剧本数据）
  └── 依赖 CharacterController（角色绑定）

DramatizeController
  └── 依赖 ScriptController（剧本内容）
  └── 依赖 CharacterController（角色音色/外形）
```

## For AI Agents

### 修改业务状态
- 状态定义在各 Controller 的 `TInternalState` interface
- 更新方法：`this[BaseModel.UpdateInternalSymbol]({ ... })`
- 对外暴露 `state` 属性（readonly）

### 新增跨页面功能
1. 在对应 `controllers/{domain}/` 目录下创建或修改 Controller
2. 用 `@injectable()` 标记，构造函数声明依赖（Inversify 自动注入）
3. 在 `core/zone/` 的 `createZone` 函数中绑定新 Controller

<!-- MANUAL: -->
