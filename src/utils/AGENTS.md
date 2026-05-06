<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-24 | Updated: 2026-04-24 -->

# src/utils/ — 工具函数层

## Purpose

纯函数工具库，无副作用，无 React 依赖，无业务逻辑。供全层使用。

## 工具清单

| 文件/目录 | 导出名 | 说明 |
|-----------|--------|------|
| `string.ts` | `StringUtils` | 字符串截断、格式化、正则工具 |
| `array.ts` | `ArrayUtils` | 数组去重、分组、排序、查找 |
| `date.ts` | `DateUtils` | 日期格式化（基于 dayjs）|
| `math.ts` | `MathUtils` | 数值限制、插值、随机数 |
| `json.ts` | `JsonUtils` | 安全 JSON 解析/序列化 |
| `file.ts` | `FileUtils` | 文件路径、扩展名、大小格式化 |
| `tos.ts` | `TosUtils` | 火山引擎 TOS URL 生成、签名 |
| `data-store.ts` | `DataStoreUtils` | DataItem 创建/克隆工具 |
| `class.ts` | `ClassUtils` / `ObjectUtils` | 对象深克隆、合并、diff |
| `timer/` | `TimerUtils` | 防抖、节流、延迟、RAF 封装 |
| `list/` | `ListUtils` | 分页列表管理（加载更多、刷新）|
| `@com/` | `KeyUtils` | 内部工具（key 生成等）|

## For AI Agents

- 新增工具函数：放入对应 `{domain}Utils` 文件，或新建 `{name}.ts`
- 命名规范：`export const {Domain}Utils = { fn1, fn2 }` 对象导出
- 不得在 utils 中 import React、Controller、Service

<!-- MANUAL: -->
