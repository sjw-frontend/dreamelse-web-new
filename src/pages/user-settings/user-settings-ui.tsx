import { useReactive, useRegisterRenderController } from '$/hooks';
import { optimize } from '$/view';

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
        className="flex flex-row items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-bg-card disabled:cursor-default active:opacity-70 transition-opacity"
    >
        <div className="flex flex-row items-center gap-2.5 flex-1 min-w-0 mr-3">
            {logo != null && (
                <span className="text-lg leading-none">{logo}</span>
            )}
            <span className="text-text text-base font-normal">{label}</span>
        </div>
        <div className="flex flex-row items-center gap-2 shrink-0 max-w-[50%]">
            {value != null && (
                <span className="text-text/60 text-base font-normal truncate">{value}</span>
            )}
            {showArrow && (
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="text-text/40 shrink-0"
                >
                    <path
                        d="M6 3l5 5-5 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </div>
    </button>
);

export const UserSettingsPage = optimize(() => {
    const [ctrl, RenderParentProvider] = useRegisterRenderController(UserSettingsController);
    const state = useReactive(() => ({
        terms: ctrl.state.terms,
    }));

    const handleTerms = () => {
        const url = state.terms?.user_agreement;
        if (url) {
            ctrl.toWeb(I18nTexts.terms, url);
        } else {
            ctrl.toPdf('TermsOfService' as any);
        }
    };

    const handlePrivacy = () => {
        const url = state.terms?.privacy_policy;
        if (url) {
            ctrl.toWeb(I18nTexts.privacy, url);
        } else {
            ctrl.toPdf('PrivacyPolicy' as any);
        }
    };

    const handleFollowUs = () => {
        const url = state.terms?.xhs ?? Settings.xiaohongshuUrl;
        ctrl.toWeb(I18nTexts.xiaohongshuTitle, url);
    };

    const handleContactUs = () => {
        ctrl.openEmail();
    };

    const handleDeactivate = () => {
        ctrl.toCancelAccount();
    };

    const handleLogout = () => {
        ctrl.logout();
    };

    return (
        <RenderParentProvider>
            <div className="flex flex-col h-full bg-bg-card">
                {/* Header */}
                <div className="flex flex-row items-center px-4 pt-4 pb-2 gap-3">
                    <button
                        type="button"
                        onClick={ctrl.back}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 active:opacity-70 transition-opacity"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                                d="M12.5 15l-5-5 5-5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-text"
                            />
                        </svg>
                    </button>
                    <span className="text-text text-lg font-semibold">{I18nTexts.pageTitle}</span>
                </div>

                {/* Scroll content */}
                <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 flex flex-col gap-3">
                    <SettingRow
                        logo="🎬"
                        label={I18nTexts.about}
                        showArrow
                        onPress={ctrl.toAbout}
                    />
                    <SettingRow
                        logo="🤝🏻"
                        label={I18nTexts.terms}
                        showArrow
                        onPress={handleTerms}
                    />
                    <SettingRow
                        logo="🤐"
                        label={I18nTexts.privacy}
                        showArrow
                        onPress={handlePrivacy}
                    />
                    <SettingRow
                        logo="📕"
                        label={I18nTexts.followUs}
                        showArrow
                        onPress={handleFollowUs}
                    />
                    <SettingRow
                        logo="🤝"
                        label={I18nTexts.contactUs}
                        value={Settings.email}
                        showArrow
                        onPress={handleContactUs}
                    />
                    <SettingRow
                        logo="🗑"
                        label={I18nTexts.deactivateAccount}
                        showArrow
                        onPress={handleDeactivate}
                    />
                </div>

                {/* Bottom bar */}
                <div className="px-4 pt-2.5 pb-4 bg-bg-card">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-lg font-medium active:opacity-70 transition-opacity"
                    >
                        {I18nTexts.logoutButton}
                    </button>
                </div>
            </div>
        </RenderParentProvider>
    );
});
