// event definition source: https://docs.qq.com/sheet/DRmtnek1XeExxS2dE?tab=pt6vyc
export const Events = {
    Registration: {
        complete: {
            name: 'af_complete_registration',
            params: {
                method: {
                    name: 'af_registration_method',
                    apple: 'apple',
                    google: 'google',
                },
                uaChannel: 'ua_channel',
            },
        },
        enter: 'enter_registration',
        leave: {
            name: 'leave_registration',
            params: {
                name: 'click_button',
                display: 'display',
                google: 'google',
                apple: 'apple',
            },
        },
        onBoardingSkip: 'onboarding_skip',
        onBoardingComplete: 'onboarding_complete',
    },
    Upload: {
        start: {
            name: 'upload_start',
            params: {
                fileType: 'file_type',
                video: 'video',
                image: 'image',
            },
        },
        publishPhoto: {
            name: 'publish_mode_photo',
            params: {
                action: {
                    name: 'press_type_photo',
                    back: 'back',
                    longpress: 'longpress',
                    swipe: 'swipe_generate',
                },
            },
        },
        uploadVideo: {
            name: 'upload_video',
            params: {
                action: {
                    name: 'upload_forward',
                    post: 'post',
                    back: 'back',
                    motion: 'motion',
                    swipeLeft: 'swipe_left',
                },
            },
        },
        publishVideo: {
            name: 'publish_mode_video',
            params: {
                action: {
                    name: 'press_type_video',
                    back: 'back',
                    longpress: 'longpress',
                    swipe: 'swipe_generate',
                },
            },
        },
        collage: 'collage_start',
    },
    Swipe: {
        videoSwipeLeft: {
            name: 'video_slide_left',
            params: {
                videoId: 'video_id',
            },
        },
    },
    Remix: {
        videoRemix: {
            name: 'video_remix',
            params: {
                videoId: 'video_id',
            },
        },
    },
    Publish: {
        publish: {
            name: 'redo_choose',
            params: {
                type: {
                    name: 'redochoose_type',
                    redo: 'redo',
                    post: 'post',
                    swipe: 'swipe',
                    drop: 'drop',
                    private: 'private',
                },
            },
        },
    },
    Share: {
        sharePersonal: {
            name: 'personal_video_share',
            params: {
                channel: {
                    name: 'personal_share_channel',
                    copyLink: 'copy_link',
                    download: 'download',
                    more: 'more',
                    delete: 'delete',
                },
                type: {
                    name: 'download_type',
                    mp4: 'mp4',
                    gif: 'gif',
                },
                videoId: 'video_id',
            },
        },
        shareOthers: {
            name: 'others_share_channel',
            params: {
                name: 'others_share_channel',
                block: 'block',
                report: 'report',
                videoId: 'video_id',
            },
        },
    },
    Scene: {
        exit: {
            name: 'scene_exit',
            params: {
                sceneName: {
                    name: 'scene_name',
                    feed: 'feed',
                    generate: 'generate',
                    discover: 'discover',
                },
                duration: 'scene_duration',
            },
        },
    },
    App: {
        appLaunch: {
            name: 'app_launch',
            params: {
                name: 'launch_type',
                coldStart: 'cold_start',
                hotStart: 'hot_start',
            },
        },
        appSessionEnd: {
            name: 'app_session_end',
            params: {
                name: 'session_duration',
            },
        },
    },
    Feed: {
        feedUpDown: {
            name: 'feed_updown',
            params: {
                up: 'feed_up_count',
                down: 'feed_down_count',
            },
        },
        discoverUpDown: {
            name: 'discover_updown',
            params: {
                up: 'discover_up_count',
                down: 'discover_down_count',
            },
        },
    },
} as const;

export const Duration = {
    minMS: 500,
    fraction: 0,
};
