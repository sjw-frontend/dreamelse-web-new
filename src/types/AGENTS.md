<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-24 | Updated: 2026-04-24 -->

# src/types/ — 全局类型定义层

## Purpose

全局共享的 TypeScript 类型，以 `namespace` 组织，保持与业务域一一对应。所有跨文件共享的类型必须在此声明（不要在组件内定义共享类型）。

## 文件清单

| 文件 | Namespace | 核心类型 |
|------|-----------|----------|
| `character.ts` | `CharacterTypes` | `CharacterState`, `MessageState`, `ScheduleState`, `Figure`, `Timbre`, `Relationship`, `Stats` |
| `script.ts` | `ScriptTypes` | `ScriptState`, `RoleInfo`, `SceneInfo`, `Kind`, `Tag` |
| `dramatize.ts` | `DramatizeTypes` | 演绎会话、进度、帧数据类型 |
| `world-line.ts` | `WorldLineTypes` | 时间线条目、事件类型 |
| `user.ts` | `UserTypes` | `UserId`, `UserState`, `UserProfile` |
| `api.ts` | `ApiTypes` | `Protocol`（请求/响应类型），`ProtocolCallMethods` |
| `router.ts` | `RouterTypes` | `RouteParamList`（每个路由的参数类型）|
| `core.ts` | `CoreTypes` | `ModelState`, `Props`, `RenderControllerClass` 等架构核心类型 |
| `react.ts` | `ReactTypes` | `FCWC`（FC with children）等 React 扩展类型 |
| `app.ts` | `AppTypes` | 应用级配置类型 |
| `style.ts` | `StyleTypes` | 主题、颜色 token 类型 |
| `canvas.ts` | `CanvasTypes` | Canvas / WebGPU 渲染类型 |
| `file.ts` | `FileTypes` | `SimpleVisual`, `SimpleAudio`, `ImageResource`, `Uri` |
| `report.ts` | `ReportTypes` | 埋点事件类型 |
| `data-store.ts` | `DataStoreTypes` | `DataItem`, `DataItemId`（通用数据项容器）|

## 关键类型说明

### CharacterTypes.CharacterState
角色完整状态，包含：
- 基础信息：`name`, `gender`, `species`, `desc`, `honorary`
- 外形：`currentFigureId`, `currentFigureSkinId`, `figureLib`
- 音色：`currentTimbreId`, `timbres`
- 社交：`relationships`, `stats`, `behavior`
- 元数据：`isPublic`, `isMe`, `author`

### ScriptTypes.BaseScriptState
剧本核心字段：`title`, `storyDesc`, `openingDesc`, `roles`, `branches`, `kinds`

### ApiTypes.Protocol
由 `bin/generate-api/` 脚本自动生成，镜像后端接口。修改需重新运行 `pnpm generate-apis`。

### RouterTypes.RouteParamList
每条路由的参数类型，新增路由时必须在此添加。格式：
```typescript
[RouterEnums.RouteName.MyPage]: { id: string } | undefined
```

## For AI Agents

### 新增类型
- 属于某业务域 → 加入对应 `{domain}.ts` 的 namespace
- 跨域通用类型 → 放入 `core.ts` 或新建 `{name}.ts`
- 不要使用 `export type` 直接导出（用 namespace 包裹保持命名隔离）

### LibTypes 全局工具类型
项目在全局声明了 `LibTypes` namespace（见 `global.d.ts`），常用类型：
```typescript
LibTypes.Nullable<T>        // T | null
LibTypes.VarDefine<T>       // 可变对象
LibTypes.FrozenDefine<T>    // 深度 readonly
LibTypes.Arr<T>             // readonly T[]
LibTypes.VarArr<T>          // T[]
LibTypes.VarGeneralObj<T>   // Record<string, T>
LibTypes.Simplify<T>        // 展开复杂类型，IDE 友好
```

<!-- MANUAL: -->
