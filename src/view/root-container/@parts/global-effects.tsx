// @ts-nocheck
import { I18N } from '$/consts';
import { AppController } from '$/controllers';
import {
    useI18n,
    useKeyboard,
    useListenEvent,
    usePopup,
    useWatch,
    useZoneController,
} from '$/hooks';
import type { ReactTypes } from '$/types';
import { optimize } from '$/view/optimize';

export const GlobalEffects: ReactTypes.FC = optimize(() => {
    const i18n = useI18n(I18N.Texts);
    const popup = usePopup();
    const app = useZoneController(AppController);
    const keyboard = useKeyboard();

    useWatch(
        () => app.state.controlMuted,
        controlMuted =>
            popup.showToast(controlMuted ? i18n.mute() : i18n.muteCanceled()),
    );

    useWatch(
        () => app.state.active,
        active => {
            if (!active) {
                keyboard.hide();
            }
        },
    );

    useListenEvent(app, 'confirmNoNetwork', async () =>
        popup.openDialogConfirm({
            title: i18n.networkDisabled(),
            content: i18n.networkDisabledContent(),
        }));

    useListenEvent(app, 'longTask', async (task, options) =>
        popup.longTask(task, options));

    useListenEvent(app, 'waitMoment', async (task, options) =>
        popup.waitMoment(task, options));

    useListenEvent(app, 'toast', key => popup.showToast(i18n[key]()));

    useListenEvent(app, 'errorDialog', msg => popup.openOkDialog(msg));

    return null;
});
