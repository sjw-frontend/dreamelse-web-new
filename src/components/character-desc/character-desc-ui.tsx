// @ts-nocheck
import { useCallback, useMemo } from 'react';
import {
    usePopup,
    useReactive,
    useRegisterRenderController,
} from '$/hooks';
import type { CharacterTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';
import { CharacterDescController } from './character-desc-controller';

type Props = LibTypes.FrozenDefine<{
    data: CharacterTypes.FrozenCharacterInfo,
    readOnly?: boolean,
    placeholder?: string,
    showTriangle?: boolean,
    style?: React.CSSProperties,
    submitToRemote?: boolean,
}>;

export const CharacterDesc: ReactTypes.FC<Props> = optimize(props => {
    const popup = usePopup();

    const [ctrl, RenderParentProvider] = useRegisterRenderController(
        CharacterDescController,
        { data: props.data, submitToRemote: !!props.submitToRemote },
    );

    const reactiveState = useReactive(() => ({
        dataState: { ...ctrl.state.data.state },
    }));

    useMemo(() => { ctrl.submitToRemote(!!props.submitToRemote); }, [props.submitToRemote]);
    useMemo(() => { ctrl.setData(props.data); }, [props.data]);

    const showTriangle = props.showTriangle ?? true;
    const readOnly = props.readOnly ?? false;
    const placeholderText = props.placeholder;
    const desc = reactiveState.dataState.desc;
    const isEmpty = !desc || desc.trim() === '';

    const handlePress = useCallback(() => {
        popup.openMultilineInputDialog({
            defaultValue: desc,
            inputName: undefined,
            placeholder: placeholderText,
            readOnly,
            onOk: ctrl.updateDesc,
        });
    }, [readOnly, desc, placeholderText]);

    const textColor = isEmpty
        ? 'rgba(255,255,255,0.15)'
        : readOnly
            ? 'rgba(255,255,255,0.4)'
            : '#EDEDED';

    return (
        <RenderParentProvider>
            <button
                type="button"
                onClick={handlePress}
                style={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 20,
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingTop: 12,
                    paddingBottom: 12,
                    height: 87,
                    width: '100%',
                    cursor: 'pointer',
                    position: 'relative',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'flex-start',
                    boxSizing: 'border-box',
                    ...props.style,
                }}
            >
                <span style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: textColor,
                    lineHeight: '21px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    flex: 1,
                }}>
                    {isEmpty ? placeholderText : desc}
                </span>
                {showTriangle && (
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        style={{ position: 'absolute', right: 16, bottom: 12, flexShrink: 0 }}
                    >
                        <path d="M2 4l4 4 4-4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>
        </RenderParentProvider>
    );
});
