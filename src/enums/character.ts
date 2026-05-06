export enum Gender {
    Girl = 1,
    Boy = 2,
    Other = 3,
}

export enum Species {
    Man = 1,
    Obj = 2,
}

export enum ApiGender {
    Girl = '女',
    Boy = '男',
    Other = '其他',
}

export enum ApiSpecies {
    Man = '人',
    Obj = '物',
}

export enum ScheduleItemKind {
    Default = 1,
    Sleep = 2,
}

export enum MessageItemKind {
    SysMsg = 1, // 系统发的消息，如：  "因为你的冷漠他不理你了，这里的状态更新提示最多26个字"
    Msg = 2, // 角色或我发的文字消息
    Meme = 3, // 角色或我发的表情
    Image = 4, // 角色或我发的图片
    Voice = 5, // 角色或我发的语言
    PlotEvent = 6, // 场景事件，会显示一个卡片，点击后跳转到另一个页面
    RecommendFriend = 7, // 推荐好友，会显示一个卡片，接受后会调用对应接口绑定新的好友关系
    GiveGift = 8, // 送出礼物
    AcceptGift = 9, // 收礼物
    Link = 10, // 打开一个链接
}

export enum MessageApiKind {
    text = 'text',
    voice = 'voice',
    image = 'image',
    gift = 'gift', // 纯语音模式
    emoji = 'emoji',
    invitation = 'invitation',
    link = 'html_file',
}

export enum MessageApiDirection {
    user = 'user',
    character = 'character',
    system = 'system',
}

export enum MessageApiChatScene {
    phone = 1,
    characterPage = 2,
    scheduleEnd = 3,
}
