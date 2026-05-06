# Character Interaction 组件图片资源

## 需要下载的图片资源

### 图标类（需要下载并保存为 SVG/PNG）

从 Figma 设计稿中提取的图片资源 URL（7天内有效）：

#### 1. 语音相关图标
- **icon-voice.svg**: 语音输入图标
  - URL: `https://www.figma.com/api/mcp/asset/8c0e9a81-9807-4dce-8ce8-184991719827`
  - 使用位置: 输入框右侧语音按钮

#### 2. 键盘/表情切换图标
- **icon-keyboard.svg**: 键盘图标（表情面板打开时显示）
  - 从设计稿中提取，用于切换键盘和表情面板

#### 3. 添加图标
- **icon-add.svg**: 添加按钮图标（+号）
  - 使用位置: 输入框右侧，打开"更多操作"面板

#### 4. 关闭图标
- **icon-close.svg**: 关闭图标（x号）
  - 使用位置: "更多操作"面板关闭按钮

#### 5. 地点图标
- **icon-location.svg**: 地点图标
  - URL: `https://www.figma.com/api/mcp/asset/5a837905-dcab-4d39-8b2f-f930ab7f2e24`
  - 使用位置: 显示角色当前位置

#### 6. 日程图标
- **icon-schedule.svg**: 日程图标
  - URL: `https://www.figma.com/api/mcp/asset/4bcd3a56-991d-4e15-ae7f-ffbe159a8135`
  - 使用位置: 顶部导航栏右侧

#### 7. 语音播放图标
- **icon-voice-play.svg**: 语音消息播放图标
  - 使用位置: 语音消息气泡中

#### 8. 礼物图标
- **icon-gift.svg**: 礼物图标（固定图片，用于显示礼物消息）
  - 需要从设计稿中提取

### 背景图片
- 背景图片从 `behavior.currentFigure` 读取，不需要下载

### 表情包
- 表情包从后端获取，暂时使用 mock 数据，不需要下载

## 下载方式

### 方式1: 从 Figma 手动导出
1. 打开 Figma 设计稿
2. 选择对应的图标元素
3. 右键 -> Export -> 选择 SVG 或 PNG 格式
4. 保存到 `assets/images/character-interaction/` 目录

### 方式2: 使用提供的 URL 下载
由于 SSL 证书问题，建议使用以下方式之一：
1. 在浏览器中打开 URL，右键保存图片
2. 使用下载工具（如 wget、aria2）下载
3. 运行提供的下载脚本（如果可用）

## 文件命名规范
- 使用小写字母和连字符
- 图标文件使用 `.svg` 扩展名
- 图片文件使用 `.png` 扩展名

## 在代码中引用
下载完成后，需要在 `src/consts/assets.ts` 中添加引用：

```typescript
export const CharacterInteraction = {
    iconVoice: require('$/assets/images/character-interaction/icon-voice.svg'),
    iconKeyboard: require('$/assets/images/character-interaction/icon-keyboard.svg'),
    iconAdd: require('$/assets/images/character-interaction/icon-add.svg'),
    iconClose: require('$/assets/images/character-interaction/icon-close.svg'),
    iconLocation: require('$/assets/images/character-interaction/icon-location.svg'),
    iconSchedule: require('$/assets/images/character-interaction/icon-schedule.svg'),
    iconVoicePlay: require('$/assets/images/character-interaction/icon-voice-play.svg'),
    iconGift: require('$/assets/images/character-interaction/icon-gift.svg'),
} satisfies FileTypes.RequireMediaAssetRecord;
```

