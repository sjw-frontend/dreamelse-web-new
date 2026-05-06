<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-24 | Updated: 2026-04-24 -->

# src/services/ — 服务层

## Purpose

无状态 I/O 服务。负责与外部系统通信（后端 API、设备能力、存储）。通过 Inversify 注入到 Controller 中。

## 服务清单

| 文件/目录 | 服务名 | 职责 |
|-----------|--------|------|
| `api.ts` | `ApiService` | 统一 HTTP 客户端，动态 proxy 生成接口调用方法，Bearer token 鉴权 |
| `app/` | `AppService` | App 版本号、环境变量、UUID |
| `fetch/` | `FetchService` | 底层 fetch 封装，超时/重试/错误处理 |
| `router.ts` | `RouterService` | 命令式导航（push/replace/back），封装 React Navigation |
| `permission.ts` | `PermissionService` | 请求/检查相机、麦克风、相册权限 |
| `media.ts` | `MediaService` | 图片选取、压缩、视频选取 |
| `device/` | `DeviceService` | 设备型号、屏幕尺寸、安全区域、平台判断 |
| `file/` | `FileService` | 本地文件读写、临时目录管理 |
| `store.ts` | `StoreService` | AsyncStorage 封装，键值持久化 |
| `secure-store/` | `SecureStoreService` | Expo SecureStore，敏感数据加密存储（token 等）|
| `voice/` | `VoiceService` | 语音识别（expo-speech-recognition）|
| `linking.ts` | `LinkingService` | Deep link 解析、URL scheme 处理 |
| `share.ts` | `ShareService` | 系统分享面板 |
| `report.ts` | `ReportService` | 埋点上报（用户行为、错误）|
| `appsflyer.ts` | `AppsFlyerService` | 归因分析 SDK |

## API 调用模式

```typescript
// 所有接口都通过 ApiService.call.{namespace}.{method}() 调用
// 类型安全，由 bin/generate-api/ 生成

const result = await this.#apiService.call.character.getDetail({ id })
// 等价于 POST/GET /character/getDetail
```

## 存储分层

| 层 | 服务 | 用途 |
|----|------|------|
| 内存 | Controller state | 运行时状态，重启清空 |
| AsyncStorage | `StoreService` | 用户偏好、缓存数据 |
| SecureStore | `SecureStoreService` | Token、敏感信息（加密）|
| 云存储 | `@volcengine/tos-sdk` | 用户上传的图片/音频（火山引擎 TOS）|

## For AI Agents

### 新增 API 接口
1. 在 `types/api.ts` 的 `ApiTypes.Protocol` namespace 中添加请求/响应类型
2. `ApiService.call` 会自动代理，无需手动注册

### 新增本地存储 Key
- 在 `consts/` 中定义 key 常量，通过 `StoreService.get/set` 访问
- 敏感数据（token）用 `SecureStoreService`

## Dependencies

### External
- `@volcengine/tos-sdk` — 火山引擎对象存储
- `expo-secure-store` — 加密本地存储
- `@react-native-async-storage/async-storage` — 键值存储
- `expo-image-picker` / `expo-media-library` — 媒体访问
- `expo-speech-recognition` — 语音识别
- `react-native-permissions` — 系统权限管理

<!-- MANUAL: -->
