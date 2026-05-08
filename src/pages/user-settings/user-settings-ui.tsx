// @ts-nocheck
import { useCallback } from 'react';
import type { ReactTypes } from '$/types';
import { useReactive, useRegisterRenderController } from '$/hooks';
import { usePopup } from '$/hooks';
import { optimize } from '$/view';
import { withAuth } from '$/hocs';

import { Settings, I18nTexts } from './user-settings-const';
import { UserSettingsController } from './user-settings-controller';

type SettingRowProps = {
    logo?: string;
    label: string;
    value?: string;
    showArrow?: boolean;
    onPress?: () => void;
};

const SettingRow = ({ logo, label, value, showArrow = false, onPress }: SettingRowProps) => (
    <button
        type="button"
        onClick={onPress}
        disabled={onPress == null}
        className="flex flex-row items-center justify-between w-full px-4 py-[14px] rounded-[20px] bg-bg-card disabled:cursor-default active:opacity-70 transition-opacity min-h-[52px]"
    >
        <div className="flex flex-row items-center gap-2.5 flex-1 min-w-0 mr-3">
            {logo != null && (
                <span className="text-lg leading-none w-5 text-center">{logo}</span>
            )}
            <span className="text-text text-base font-normal">{label}</span>
        </div>
        <div className="flex flex-row items-center gap-2 shrink-0 max-w-[50%]">
            {value != null && (
                <span className="text-text/60 text-base font-normal truncate">{value}</span>
            )}
            {showArrow && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text/40 shrink-0">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </div>
    </button>
);

export const UserSettingsPage: ReactTypes.FC = withAuth(optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(UserSettingsController);
    const popup = usePopup();

    const state = useReactive(() => ({
        terms: ctrl.state.terms,
    }));

    const handleTerms = useCallback(() => {
        const url = state.terms?.user_agreement;
        if (url) ctrl.toWeb(I18nTexts.terms, url);
        else ctrl.toPdf('TermsOfService' as any);
    }, [state.terms]);

    const handlePrivacy = useCallback(() => {
        const url = state.terms?.privacy_policy;
        if (url) ctrl.toWeb(I18nTexts.privacy, url);
        else ctrl.toPdf('PrivacyPolicy' as any);
    }, [state.terms]);

    const handleFollowUs = useCallback(async () => {
        if (
            await popup.openDialogConfirm({
                title: '关注我们',
                content: '即将跳转到小红书',
                okButton: '前往',
                cancelButton: '取消',
            })
        ) {
            ctrl.toWeb(I18nTexts.xiaohongshuTitle, state.terms?.xhs ?? Settings.xiaohongshuUrl);
        }
    }, [ctrl, popup, state.terms]);

    const handleDeactivate = useCallback(async () => {
        if (
            await popup.openDialogConfirm({
                title: '注销账号',
                content: '注销后所有数据将被删除且不可恢复',
                okButton: '确认注销',
                cancelButton: '取消',
            })
        ) {
            ctrl.toCancelAccount();
        }
    }, [ctrl, popup]);

    const handleLogout = useCallback(async () => {
        if (
            await popup.openDialogConfirm({
                title: '退出登录',
                content: '确认要退出登录吗？',
                okButton: '确认',
                cancelButton: '取消',
            })
        ) {
            ctrl.logout();
        }
    }, [ctrl, popup]);

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-page">
                {/* Header */}
                <div className="flex flex-row items-center px-4 pt-4 pb-2 gap-3 bg-bg-card">
                    <button
                        type="button"
                        onClick={ctrl.back}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 active:opacity-70 transition-opacity"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M12.5 15l-5-5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text" />
                        </svg>
                    </button>
                    <span className="text-text text-lg font-semibold">{I18nTexts.pageTitle}</span>
                </div>

                {/* Scroll content */}
                <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 flex flex-col gap-3 bg-bg-page">
                    <SettingRow logo="🎬" label={I18nTexts.about} showArrow onPress={ctrl.toAbout} />
                    <SettingRow logo="🤝🏻" label={I18nTexts.terms} showArrow onPress={handleTerms} />
                    <SettingRow logo="🤐" label={I18nTexts.privacy} showArrow onPress={handlePrivacy} />
                    <SettingRow logo="📕" label={I18nTexts.followUs} showArrow onPress={handleFollowUs} />
                    <SettingRow logo="🤝" label={I18nTexts.contactUs} value={Settings.email} showArrow onPress={ctrl.openEmail} />
                    <SettingRow logo="🗑" label={I18nTexts.deactivateAccount} showArrow onPress={handleDeactivate} />
                </div>

                {/* Bottom bar */}
                <div className="px-4 pt-2.5 pb-safe-or-3 bg-bg-card border-t border-divider">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full h-14 rounded-[20px] bg-danger/10 border border-danger/20 text-danger text-base font-medium active:opacity-70 transition-opacity flex items-center justify-center gap-2"
                    >
                        <span>👋</span>
                        <span>{I18nTexts.logoutButton}</span>
                    </button>
                </div>
            </div>
        </RenderParentProvider>
    );
}));
