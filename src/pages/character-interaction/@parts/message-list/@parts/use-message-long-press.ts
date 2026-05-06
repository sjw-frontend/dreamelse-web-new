// @ts-nocheck
import { useCallback, useRef } from 'react';
import { View } from 'react-native';

import { ASSETS } from '$/consts';
import { CharacterEnums } from '$/enums';
import { useInjectRenderController, usePopup } from '$/hooks';
import type { CharacterTypes } from '$/types';

import { CharacterInteractionController } from '../../../character-interaction-controller';

export const useMessageLongPress = (
    data: CharacterTypes.FrozenMessageInfo | null | undefined,
    dataState: CharacterTypes.MessageState | null | undefined,
) => {
    const popup = usePopup();
    const bubbleRef = useRef<View>(null);

    const ctrl = useInjectRenderController(CharacterInteractionController);

    const handleLongPress = useCallback(() => {
        if (!data || !dataState) {
            return;
        }

        const { fromMe, kind, id, isLocal } = data;
        const { isSuccess, audio, content } = dataState;

        if (kind === CharacterEnums.MessageItemKind.SysMsg) {
            return;
        }

        const text =
            kind === CharacterEnums.MessageItemKind.Voice
                ? audio?.text
                : content;

        const canCopy = kind === CharacterEnums.MessageItemKind.Msg;
        const canRollback = isSuccess && !isLocal;

        if (!canCopy && !canRollback) {
            return;
        }

        bubbleRef.current?.measure((_x, _y, width, _height, pageX, pageY) => {
            const options = [];

            if (canCopy) {
                options.push({
                    label: '复制',
                    value: 'copy',
                    icon: ASSETS.CharacterInteraction.iconCopy,
                });
            }

            if (canRollback) {
                options.push({
                    label: '回溯',
                    value: 'rollback',
                    icon: ASSETS.CharacterInteraction.iconRollback,
                });
            }

            if (options.length === 0) {
                return;
            }

            const coordinate = fromMe
                ? { x: pageX, y: pageY }
                : { x: pageX + width, y: pageY };

            const anchor = fromMe ? 'top-right' : 'top-left';

            popup.openMenu({
                optionList: options,
                coordinate,
                anchor,
                menuStyleType: 'blur',
                showMask: true,
                onChange: (_, option) => {
                    if (option.value === 'copy') {
                        ctrl.copyMsg(text ?? '');
                        popup.showToast('已复制');
                    } else if (option.value === 'rollback') {
                        popup
                            .openDialogConfirm({
                                title: '回溯后，该条消息之后的内容都会被清除',
                            })
                            .then(value => {
                                if (value) {
                                    ctrl.msgRollback(id).then(() => {
                                        popup.showToast('已完成');
                                    });
                                }
                            });
                    }

                    popup.closeMenu();
                },
            });
        });
    }, [data, dataState]);

    return { bubbleRef, handleLongPress };
};
