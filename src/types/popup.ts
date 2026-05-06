// @ts-nocheck
import type { StyleEnums } from '$/enums';
import type { ViewTypes } from '$/types';
import type {
    DialogProps,
    DualInputDialogProps,
    MenuProps,
    MultilineInputDialogProps,
    SingleInputDialogProps,
    DialogButton as UIDialogButton,
} from '$/uis';

import type { FileTypes } from './file';

export declare namespace PopupTypes {
    type OverlayInfo = LibTypes.FrozenDefine<{
        content: ViewTypes.UINode,
    }>;

    type PopupInfo = LibTypes.Define<{
        dialog: DialogInfo | null,
        panel: PanelInfo | null,
        toast: ToastInfo | null,
        message: MessageInfo | null,
        actionSheet: ActionSheetInfo | null,
        loader: LoaderInfo | null,
        dualInputDialog: DualInputDialogInfo | null,
        singleInputDialog: SingleInputDialogInfo | null,
        multilineInputDialog: MultilineInputDialogInfo | null,
        menu: MenuInfo | null,
        imageViewer: ImageViewerInfo | null,
        overlay: OverlayInfo | null,
    }>;

    type CallbackOptions = LibTypes.FrozenDefine<{
        close: LibTypes.SimpleFunction, // TODO 不应该是close
    }>;

    type BaseDialogConfirmButton = LibTypes.FrozenOmit<DialogButton, 'onPress'>;

    type DialogConfirmButton = BaseDialogConfirmButton | string;

    type DialogButton = LibTypes.FrozenDefine<
        LibTypes.FrozenOmit<UIDialogButton, 'onPress'> & {
            onPress?: LibTypes.Func<unknown, [options: CallbackOptions]>,
        }
    >;

    type DialogInfo = LibTypes.FrozenDefine<
        LibTypes.VarOmit<DialogProps, 'active' | 'buttons'> & {
            buttons?: LibTypes.Arr<DialogButton>,
        },
        'contentContainerStyle'
    >;

    type ToastInfo = LibTypes.FrozenDefine<{
        text: string,
        position?: 'bottom' | 'center' | 'nearBottom' | 'top',
        onPress?: LibTypes.SimpleFunction,
        pressHide?: boolean,
        /** MS */
        autoHide?: number | false,
        icon?: 'back' | 'fileFail' | 'loading' | 'ok' | 'share',
    }>;

    type MessageInfo = LibTypes.FrozenDefine<{
        content?: ViewTypes.UINode,
    }>;

    type ActionSheetButton = LibTypes.FrozenDefine<{
        text: string,
        kind?: StyleEnums.ButtonKind.Danger | StyleEnums.ButtonKind.Primary,
        disabled?: boolean,
        onPress?: LibTypes.SimpleFunction,
    }>;

    type ActionSheetConfirmOKButton =
        | LibTypes.FrozenOmit<ActionSheetButton, 'onPress'>
        | string;

    type ActionSheetConfirmCancelButton =
        | LibTypes.FrozenOmit<ActionSheetCancelButton, 'onPress'>
        | string;

    type ActionSheetCancelButton = LibTypes.FrozenDefine<{
        text?: string,
        color?: string,
        onPress?: LibTypes.SimpleFunction,
    }>;

    type ActionSheetInfo = LibTypes.FrozenDefine<{
        title: string,
        content?: string,
        tintColor?: string,
        buttons?: LibTypes.Arr<ActionSheetButton>,
        cancelButton?: ActionSheetCancelButton,
    }>;

    type PanelInfo = LibTypes.FrozenDefine<{
        items: LibTypes.Arr<PanelItem>,
        content?: ViewTypes.UINode,
    }>;

    type PanelItem = LibTypes.FrozenDefine<{
        content: {
            title: string,
            icon: FileTypes.RequireMediaAsset,
        },
        pressed?: {
            title: string,
            icon: FileTypes.RequireMediaAsset,
            durationMS?: number,
        },
        kind?: 'danger' | 'default',
        onPress?: LibTypes.Func<unknown, [options: CallbackOptions]>,
    }>;

    type BaseLoaderInfo = LibTypes.FrozenDefine<{
        mask?: boolean,
        maskStyle?: {
            color?: string,
        },
        theme?: 'dark' | 'gray' | 'light' | 'white',
        text: LibTypes.Arr<string> | string | null,
        showContentDelayMS?: number,
    }>;

    type LoaderInfo = LibTypes.FrozenDefine<
        | LibTypes.SetFieldType<
              Partial<BaseLoaderInfo> & {
                  kind: 'silence',
              },
              keyof BaseLoaderInfo,
              undefined
          >
        | (BaseLoaderInfo & {
              kind?: 'default',
          })
    >;

    type DualInputDialogInfo = LibTypes.FrozenOmit<
        DualInputDialogProps,
        'active' | 'onChange' | 'onClose' | 'values'
    >;

    type SingleInputDialogInfo = LibTypes.FrozenOmit<
        SingleInputDialogProps,
        'active' | 'onChange' | 'onClose' | 'value'
    >;

    type MultilineInputDialogInfo = LibTypes.FrozenOmit<
        MultilineInputDialogProps,
        'active' | 'onChange' | 'onClose' | 'value'
    >;

    type MenuInfo = LibTypes.FrozenOmit<MenuProps, 'active' | 'onClose'>;

    type ImageViewerInfo = LibTypes.FrozenDefine<{
        source: FileTypes.RequireMediaAsset | string,
    }>;
}
