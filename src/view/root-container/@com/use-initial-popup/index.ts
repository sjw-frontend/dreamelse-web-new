// @ts-nocheck
import { useMemo, useState } from 'react';
import { StyleEnums } from '$/enums';
import { ApiError } from '$/errors';
import { useI18n, useZone } from '$/hooks';
import { DeviceService } from '$/services';
import type { PopupTypes } from '$/types';
import { TaskUtils } from '$/utils';
import { I18nTexts, Settings } from './use-initial-popup-const';

type LockOptions = LibTypes.FrozenDefine<{
    errorPrompt?: boolean | string;
    showContentDelayMS?: number;
    mask?: boolean;
    timeoutMS?: number;
    content?: LibTypes.Arr<string> | string;
}>;

export const useInitialPopup = () => {
    const zone = useZone();
    const deviceService = zone.getService(DeviceService);
    const i18n = useI18n(I18nTexts);

    const [dialog, setDialog] = useState<PopupTypes.DialogInfo | null>(null);
    const [panel, setPanel] = useState<PopupTypes.PanelInfo | null>(null);
    const [toast, setToast] = useState<PopupTypes.ToastInfo | null>(null);
    const [message, setMessage] = useState<PopupTypes.MessageInfo | null>(null);
    const [actionSheet, setActionSheet] = useState<PopupTypes.ActionSheetInfo | null>(null);
    const [loader, setLoader] = useState<PopupTypes.LoaderInfo | null>(null);
    const [dualInputDialog, setDualInputDialog] = useState<PopupTypes.DualInputDialogInfo | null>(null);
    const [singleInputDialog, setSingleInputDialog] = useState<PopupTypes.SingleInputDialogInfo | null>(null);
    const [multilineInputDialog, setMultilineInputDialog] = useState<PopupTypes.MultilineInputDialogInfo | null>(null);
    const [menu, setMenu] = useState<PopupTypes.MenuInfo | null>(null);
    const [imageViewer, setImageViewer] = useState<PopupTypes.ImageViewerInfo | null>(null);
    const [overlay, setOverlay] = useState<PopupTypes.OverlayInfo | null>(null);

    const helperMemo = useMemo(() => {
        let messageTimeoutHandle: LibTypes.TimerHandle | null = null;
        const helper = {
            openButtonsDialog: (info: PopupTypes.DialogInfo) => {
                deviceService.dismissKeyboard();
                setDialog({ ...info });
                return (newInfo: Partial<PopupTypes.DialogInfo>) => setDialog({ ...info, ...newInfo });
            },
            closeDialog: () => setDialog(null),
            openOkDialog: (
                info: LibTypes.Simplify<LibTypes.FrozenDefine<{ onOk?: LibTypes.SimpleFunction }> & LibTypes.VarOmit<PopupTypes.DialogInfo, 'buttons'>> | string,
            ) => {
                deviceService.dismissKeyboard();
                if (typeof info === 'string') {
                    setDialog({ position: 'bottom', title: info, buttons: [{ text: i18n.ok(), onPress: ({ close }) => close() }] });
                } else {
                    setDialog({ position: 'bottom', ...info, buttons: [{ text: i18n.ok(), onPress: ({ close }) => { close(); info.onOk?.(); } }] });
                }
            },
            openPanel: (info: PopupTypes.PanelInfo | PopupTypes.PanelInfo['items']) => {
                deviceService.dismissKeyboard();
                setPanel(info instanceof Array ? { items: info } : { ...info });
            },
            closePanel: () => setPanel(null),
            openActionSheet: (info: PopupTypes.ActionSheetInfo) => setActionSheet(info),
            openDialogConfirm: async (
                info: LibTypes.Simplify<LibTypes.FrozenDefine<{ okButton?: PopupTypes.DialogConfirmButton; cancelButton?: PopupTypes.DialogConfirmButton }> & LibTypes.VarOmit<PopupTypes.DialogInfo, 'buttons'>>,
                options: LibTypes.FrozenDefine<{ onBeforeOk?: LibTypes.Asyncable<boolean>; signal?: AbortSignal }> = {},
            ) =>
                new Promise<boolean>(resolve => {
                    const { signal, onBeforeOk } = options;
                    signal?.addEventListener('abort', () => { helper.closeDialog(); resolve(false); }, { once: true });
                    const okButton: PopupTypes.DialogButton = {
                        ...(typeof info.okButton === 'string' ? { text: info.okButton } : (info.okButton ?? { text: i18n.ok() })),
                        onPress: async ({ close }) => { close(); if (!onBeforeOk || (await onBeforeOk())) resolve(true); },
                    };
                    const cancelButton: PopupTypes.DialogButton = {
                        kind: StyleEnums.ButtonKind.Text,
                        lightText: info.position === 'bottom' ? undefined : true,
                        ...(typeof info.cancelButton === 'string' ? { text: info.cancelButton } : (info.cancelButton ?? { text: i18n.cancel() })),
                        onPress: ({ close }) => { close(); resolve(false); },
                    };
                    const isCenter = info.position !== 'bottom';
                    const buttonGroupKind = info.buttonGroupKind ?? (isCenter ? StyleEnums.ButtonGroupKind.Row : StyleEnums.ButtonGroupKind.Column);
                    helper.openButtonsDialog({
                        pressMaskClose: true,
                        ...info,
                        onClose: () => resolve(false),
                        buttons: buttonGroupKind === StyleEnums.ButtonGroupKind.Column ? [okButton, cancelButton] : [cancelButton, okButton],
                    });
                }),
            openActionSheetConfirm: async (
                info: LibTypes.Simplify<LibTypes.FrozenDefine<{ okButton?: PopupTypes.ActionSheetConfirmOKButton; cancelButton?: PopupTypes.ActionSheetConfirmCancelButton }> & LibTypes.FrozenOmit<PopupTypes.ActionSheetInfo, 'buttons' | 'cancelButton'>>,
                onOk?: LibTypes.Asyncable<boolean>,
            ) =>
                new Promise<boolean>(resolve => {
                    helper.openActionSheet({
                        ...info,
                        buttons: [{ ...(typeof info.okButton === 'string' ? { text: info.okButton } : (info.okButton ?? { text: i18n.ok() })), onPress: async () => { if (!onOk || (await onOk())) resolve(true); } }],
                        cancelButton: { ...(typeof info.cancelButton === 'string' ? { text: info.cancelButton } : (info.cancelButton ?? { text: i18n.cancel() })), onPress: () => resolve(false) },
                    });
                }),
            showToast: (info: PopupTypes.ToastInfo | string) => {
                setToast(typeof info === 'string' ? { text: info } : { ...info });
            },
            hideToast: () => setToast(null),
            showMessage: (info: PopupTypes.MessageInfo | string) => {
                setMessage(typeof info === 'string' ? { content: info } : { ...info });
                clearTimeout(messageTimeoutHandle);
                messageTimeoutHandle = setTimeout(() => helper.hideMessage(), Settings.messageDurationMS);
            },
            hideMessage: () => setMessage(null),
            showLoader: (info?: PopupTypes.LoaderInfo | string) => {
                if (info == null) setLoader({ kind: 'default', text: null });
                else if (typeof info === 'string') setLoader({ text: info });
                else setLoader(info);
            },
            hideLoader: () => setLoader(null),
            openDualInputDialog: (info: PopupTypes.DualInputDialogInfo) => {
                deviceService.dismissKeyboard();
                setDualInputDialog(info);
                return (newInfo: Partial<PopupTypes.DualInputDialogInfo>) => setDualInputDialog({ ...info, ...newInfo });
            },
            closeDualInputDialog: () => setDualInputDialog(null),
            openSingleInputDialog: (info: PopupTypes.SingleInputDialogInfo) => {
                deviceService.dismissKeyboard();
                setSingleInputDialog(info);
                return (newInfo: Partial<PopupTypes.SingleInputDialogInfo>) => setSingleInputDialog({ ...info, ...newInfo });
            },
            closeSingleInputDialog: () => setSingleInputDialog(null),
            openMultilineInputDialog: (info: PopupTypes.MultilineInputDialogInfo) => {
                deviceService.dismissKeyboard();
                setMultilineInputDialog(info);
                return (newInfo: Partial<PopupTypes.MultilineInputDialogInfo>) => setMultilineInputDialog({ ...info, ...newInfo });
            },
            closeMultilineInputDialog: () => setMultilineInputDialog(null),
            openMenu: (info: PopupTypes.MenuInfo) => {
                setMenu(info);
                return (newInfo: Partial<PopupTypes.MenuInfo>) => setMenu({ ...info, ...newInfo });
            },
            closeMenu: () => setMenu(null),
            openImageViewer: (info: PopupTypes.ImageViewerInfo) => setImageViewer(info),
            closeImageViewer: () => setImageViewer(null),
            openOverlay: (info: PopupTypes.OverlayInfo) => setOverlay(info),
            closeOverlay: () => setOverlay(null),
            lock: async (task: LibTypes.Asyncable | LibTypes.Promisable, options: LockOptions = {}) => {
                const { timeoutMS, content, mask, showContentDelayMS, errorPrompt } = options;
                try {
                    helper.showLoader({ text: content ?? null, showContentDelayMS, mask });
                    await TaskUtils.runWithTimeout(task, timeoutMS);
                } catch (err) {
                    if (errorPrompt !== false && errorPrompt != null) {
                        const msg = typeof errorPrompt === 'string' ? errorPrompt : i18n.networkFail();
                        if (err instanceof ApiError) { err.customMsg = msg; } else { helper.openOkDialog(msg); }
                    }
                    throw err;
                } finally {
                    helper.hideLoader();
                }
            },
            longTask: async (task: LibTypes.Asyncable | LibTypes.Promisable, options: LibTypes.FrozenOmit<LockOptions, 'mask'> = {}) =>
                helper.lock(task, { errorPrompt: true, ...options, mask: true }),
            waitMoment: async (task: LibTypes.Asyncable | LibTypes.Promisable, options: LibTypes.FrozenOmit<LockOptions, 'showContentDelayMS'> = {}) =>
                helper.lock(task, { errorPrompt: true, ...options, showContentDelayMS: Settings.showContentDelayMS }),
        };
        return helper;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        helper: helperMemo,
        state: { dialog, panel, toast, message, actionSheet, loader, dualInputDialog, singleInputDialog, multilineInputDialog, menu, imageViewer, overlay },
    };
};
