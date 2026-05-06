// web版：assets 使用 public/ 下的静态路径
import type { FileTypes } from '$/types';

const BASE = '/assets/images';

export const Login = {
    bg:           `${BASE}/login/bg.png`,
    titleYanwo:   `${BASE}/login/title-yanwo.svg`,
    titleBelike:  `${BASE}/login/title-belike.svg`,
    iconPhone:    `${BASE}/login/icon-phone.svg`,
    iconApple:    `${BASE}/login/icon-apple.svg`,
    iconWechat:   `${BASE}/login/icon-wechat.svg`,
    iconQQ:       `${BASE}/login/icon-qq.svg`,
};

export const Logo = {
    common:      `${BASE}/logo/common.png`,
    app:         `${BASE}/logo/app.png`,
    icon:        `${BASE}/logo/icon.png`,
    main:        `${BASE}/logo/main.png`,
    light:       `${BASE}/logo/light.png`,
    story:       `${BASE}/logo/story.png`,
    coin:        `${BASE}/logo/coin.png`,
    createRole:  `${BASE}/logo/create-role.png`,
    createStory: `${BASE}/logo/create-story.png`,
    add:         `${BASE}/logo/add.svg`,
    addLight:    `${BASE}/logo/add-light.svg`,
};

export const Navbar = {
    home:           `${BASE}/navbar/home.svg`,
    homeFocus:      `${BASE}/navbar/home-focus.svg`,
    add:            `${BASE}/navbar/add.svg`,
    me:             `${BASE}/navbar/me.svg`,
    meFocus:        `${BASE}/navbar/me-focus.svg`,
    character:      `${BASE}/navbar/character.svg`,
    characterFocus: `${BASE}/navbar/character-focus.svg`,
};

export const Common = {
    back:              `${BASE}/common/back.svg`,
    backWhite:         `${BASE}/common/back-white.svg`,
    back2:             `${BASE}/common/back2.svg`,
    close:             `${BASE}/common/close-white.svg`,
    closeBlack:        `${BASE}/common/close-black.svg`,
    closeGray:         `${BASE}/common/close-gray.svg`,
    closeCircle:       `${BASE}/common/close-circle.svg`,
    closeCircleBig:    `${BASE}/common/close-circle-big.svg`,
    add:               `${BASE}/common/add.svg`,
    add2:              `${BASE}/common/add2.svg`,
    more:              `${BASE}/common/more.svg`,
    moreWhite:         `${BASE}/common/icon-more-white.svg`,
    moreGray:          `${BASE}/common/more-gray.svg`,
    moreDown:          `${BASE}/common/more-down.svg`,
    goto:              `${BASE}/common/goto.svg`,
    goto2:             `${BASE}/common/goto2.svg`,
    search:            `${BASE}/common/icon-search.svg`,
    searchLight:       `${BASE}/common/icon-search-light.svg`,
    settings:          `${BASE}/common/icon-settings.svg`,
    collect:           `${BASE}/common/icon-collect.svg`,
    collectV2:         `${BASE}/common/icon-collect-v2.svg`,
    collected:         `${BASE}/common/icon-collected.svg`,
    collectedV2:       `${BASE}/common/icon-collected-v2.svg`,
    play:              `${BASE}/common/play.svg`,
    playLight:         `${BASE}/common/icon-play-light.svg`,
    me:                `${BASE}/common/icon-me.svg`,
    meLight:           `${BASE}/common/icon-me-light.svg`,
    edit:              `${BASE}/common/icon-edit-white.svg`,
    editBlack:         `${BASE}/common/icon-edit-black.svg`,
    editGray:          `${BASE}/common/icon-edit-gray.svg`,
    lock:              `${BASE}/common/lock.svg`,
    unlock:            `${BASE}/common/unlock.svg`,
    star:              `${BASE}/common/icon-star.svg`,
    goal:              `${BASE}/common/goal.svg`,
    logoGray:          `${BASE}/common/logo-gray.svg`,
    splashLogo:        `${BASE}/common/splash-logo.png`,
    welcomeLogo:       `${BASE}/common/welcome-logo.png`,
    starWhiteBg:       `${BASE}/common/star-white-bg.png`,
    placeholderBg:     `${BASE}/common/placeholder-bg.svg`,
    dashedLine:        `${BASE}/common/dashed-line.svg`,
    man:               `${BASE}/common/man.svg`,
    manGreen:          `${BASE}/common/man-green.svg`,
    women:             `${BASE}/common/women.svg`,
    womenGreen:        `${BASE}/common/women-green.svg`,
    voice:             `${BASE}/common/icon_voice.svg`,
    voiceWhite:        `${BASE}/common/icon-voice-white.svg`,
    warning:           `${BASE}/common/icon-warning.svg`,
    figure:            `${BASE}/common/icon-figure.svg`,
    book:              `${BASE}/common/icon-book.svg`,
    bookDark:          `${BASE}/common/icon-book-dark.svg`,
    album:             `${BASE}/common/icon-album.svg`,
    albumWhite:        `${BASE}/common/icon-album-white.svg`,
    dislike:           `${BASE}/common/icon-dislike.svg`,
    location:          `${BASE}/common/icon-location.svg`,
    loading:           `${BASE}/common/icon-loading.svg`,
    replace:           `${BASE}/common/replace.svg`,
    openRole:          `${BASE}/open-role.svg`,
    refresh:           `${BASE}/refresh.svg`,
    arrow:             `${BASE}/arrow.svg`,
    previousRight:     `${BASE}/previous-right.svg`,
    previousRightBlack:`${BASE}/previous-right-black.svg`,
    previousUpward:    `${BASE}/previous-upward.svg`,
    previousDownward:  `${BASE}/previous-downward.svg`,
    previous:          `${BASE}/previous.svg`,
    gradientButton:    `${BASE}/gradient-button.svg`,
    grabber:           `${BASE}/grabber.svg`,
    lockWithBg:        `${BASE}/lock-with-bg.svg`,
    unlockWithBg:      `${BASE}/unlock-with-bg.svg`,
    panelBlock:        `${BASE}/panel-block.svg`,
    panelReport:       `${BASE}/panel-report.svg`,
    close2:            `${BASE}/close2.svg`,
    radio:             `${BASE}/radio.svg`,
    radioChecked:      `${BASE}/radio-checked.svg`,
    cardSelected:      `${BASE}/card-selected.svg`,
    cardUnselect:      `${BASE}/card-unselect.svg`,
    videoExpand:       `${BASE}/video-expand.svg`,
    motionBar:         `${BASE}/motion-bar.svg`,
    motionNewSticker:  `${BASE}/motion-new-sticker.png`,
    motionsSelectionBg:`${BASE}/motions-selection-background.png`,
    loadingProgressEllipse: `${BASE}/loading-progress-ellipse.svg`,
};

export const NewCommon = {
    closeCircleBig:  `${BASE}/common/close-circle-big.svg`,
    closeCircle:     `${BASE}/common/close-circle.svg`,
    iconCollect:     `${BASE}/common/icon-collect.svg`,
    iconCollected:   `${BASE}/common/icon-collected.svg`,
    moreWhite:       `${BASE}/common/icon-more-white.svg`,
    moreGray:        `${BASE}/common/more-gray.svg`,
};

export const Dramatize = {
    achievement:      `${BASE}/dramatize/achievement.png`,
    death:            `${BASE}/dramatize/death.png`,
    descLine:         `${BASE}/dramatize/desc-line.svg`,
    godIcon:          `${BASE}/dramatize/god-icon.svg`,
    narrativeLoading: `${BASE}/dramatize/narrative-loading.png`,
    next:             `${BASE}/dramatize/next.svg`,
    reviewStar:       `${BASE}/dramatize/review-star.svg`,
    review:           `${BASE}/dramatize/review.svg`,
    roleDesc:         `${BASE}/dramatize/role-desc.png`,
    scriptPlay:       `${BASE}/dramatize/script-play.svg`,
    speed:            `${BASE}/dramatize/speed.svg`,
    star:             `${BASE}/dramatize/star.svg`,
    unionVoice:       `${BASE}/dramatize/union-voice.svg`,
};

export const CharacterSchedule = {
    arrowLeft:      `${BASE}/character-schedule/arrow-left.svg`,
    arrowRight:     `${BASE}/character-schedule/arrow-right.svg`,
    ball:           `${BASE}/character-schedule/ball.svg`,
    expand:         `${BASE}/character-schedule/expand.svg`,
    location:       `${BASE}/character-schedule/location.svg`,
    mockBackground: `${BASE}/character-schedule/mock-background.png`,
    mockCharacter:  `${BASE}/character-schedule/mock-character.png`,
};

export const CharacterInteraction = {
    camera:          `${BASE}/character-interaction/camera.png`,
    gift:            `${BASE}/character-interaction/gift.png`,
    iconAdd:         `${BASE}/character-interaction/icon-add.svg`,
    iconClose:       `${BASE}/character-interaction/icon-close.svg`,
    iconCopy:        `${BASE}/character-interaction/icon-copy.svg`,
    iconKeyboard:    `${BASE}/character-interaction/icon-keyboard.svg`,
    iconKeyboardLight:`${BASE}/character-interaction/icon-keyboard-light.svg`,
    iconMeme:        `${BASE}/character-interaction/icon-meme.svg`,
    iconMsgVoice:    `${BASE}/character-interaction/icon-msg-voice.svg`,
    iconMsgVoiceRight:`${BASE}/character-interaction/icon-msg-voice-right.svg`,
    iconRollback:    `${BASE}/character-interaction/icon-rollback.svg`,
    iconSchedule:    `${BASE}/character-interaction/icon-schedule.svg`,
    iconSend:        `${BASE}/character-interaction/icon-send.svg`,
    iconVoice:       `${BASE}/character-interaction/icon-voice.svg`,
    iconVoiceWhite:  `${BASE}/character-interaction/icon-voice-white.svg`,
    image:           `${BASE}/character-interaction/image.png`,
    nameCard:        `${BASE}/character-interaction/name-card.png`,
};

export const Setting = {
    arrowRight: `${BASE}/setting/arrow-right.svg`,
    logoBlack:  `${BASE}/setting/logo-black.svg`,
};

export const Input = {
    searchRightIcon: `${BASE}/input/search-right-icon.svg`,
};

export const ShareApp = {
    fb:     `${BASE}/share-app/fb.png`,
    ins:    `${BASE}/share-app/ins.png`,
    tiktok: `${BASE}/share-app/tiktok.png`,
    wx:     `${BASE}/share-app/wx.png`,
    x:      `${BASE}/share-app/x.png`,
    ytb:    `${BASE}/share-app/ytb.png`,
};

export const Toast = {
    ok:       `${BASE}/toast-ok.svg`,
    back:     `${BASE}/toast-back.svg`,
    loading:  `${BASE}/toast-loading.gif`,
    fileFail: `${BASE}/toast-file-fail.svg`,
    share:    `${BASE}/toast-share.svg`,
};

export const Panel = {
    block:  `${BASE}/panel-block.svg`,
    report: `${BASE}/panel-report.svg`,
};

// Lottie animations (JSON files in public/assets/animations)
export const LogoLottie = {
    lightLogo:     '/assets/animations/light-logo.json',
    whiteDanceLogo:'/assets/animations/white-dance-logo.json',
};

export const Lottie = LogoLottie;

export const Video: Record<string, string> = {};
export const Fonts: Record<string, string> = {};
export const DramatizeEngine: Record<string, string> = {};
export const ScriptInteraction: Record<string, string> = {};
export const PDF: Record<string, string> = {};

// Satisfy FileTypes.RequireMediaAsset usage — web uses string URLs
export type { FileTypes };
