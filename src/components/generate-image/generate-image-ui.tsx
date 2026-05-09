// @ts-nocheck
import { useCallback } from 'react';
import {
    useListenEvent,
    usePopup,
    useReactive,
    useRegisterRenderController,
} from '$/hooks';
import type { FileTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';
import { GradientBackground } from '../gradient-background/gradient-background-ui';
import { GenerateImageController } from './generate-image-controller';

export type GenerateImageProps = LibTypes.FrozenDefine<{
    characterId: string | null,
    generatedImage?: {
        backgroundColor: string,
        image: FileTypes.ImageResource,
    },
}>;

export const GenerateImage: ReactTypes.FC<GenerateImageProps> = optimize(
    ({ generatedImage, characterId }) => {
        const popup = usePopup();

        const [ctrl, RenderParentProvider] = useRegisterRenderController(
            GenerateImageController,
            { characterId, generatedImage },
        );

        const reactiveState = useReactive(() => ({
            isGenerateTab: ctrl.state.isGenerateTab,
            isUploadTab: ctrl.state.isUploadTab,
            generateText: ctrl.state.generateText,
            generatedImageList: ctrl.state.generatedImageList,
            uploadImage: ctrl.state.uploadImage,
            showReUploadButton: ctrl.state.showReUploadButton,
            allowApplyGenerated: ctrl.state.allowApplyGenerated,
            allowApplyUploaded: ctrl.state.allowApplyUploaded,
            selectGeneratedImage: ctrl.state.selectGeneratedImage,
        }), { deep: true });

        const backgroundImage = reactiveState.isGenerateTab
            ? reactiveState.selectGeneratedImage?.image
            : reactiveState.isUploadTab
                ? reactiveState.uploadImage?.image
                : null;

        const backgroundColor = reactiveState.isGenerateTab
            ? reactiveState.selectGeneratedImage?.backgroundColor
            : reactiveState.uploadImage?.backgroundColor;

        const showGenerating =
            reactiveState.isGenerateTab &&
            reactiveState.generatedImageList.length > 0 &&
            reactiveState.selectGeneratedImage?.generating;

        useListenEvent(ctrl, 'generateFail', () => {
            popup.openOkDialog({ title: '生成失败', content: '请稍后重试' });
        });
        useListenEvent(ctrl, 'uploadFail', () => {
            popup.openOkDialog({ title: '上传失败', content: '请稍后重试' });
        });

        const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) ctrl.pickImageFromFile?.(file);
        }, []);

        return (
            <RenderParentProvider>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1A1A1A',
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                }}>
                    {/* 背景层 */}
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: showGenerating ? '#000' : undefined,
                    }}>
                        {showGenerating ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                {/* Lottie loading 替代：CSS spinner */}
                                <div style={{
                                    width: 98, height: 98,
                                    border: '3px solid rgba(255,255,255,0.1)',
                                    borderTopColor: 'rgba(255,255,255,0.5)',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    opacity: 0.5,
                                }} />
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: 400, marginTop: -10 }}>
                                    正在生成背景...
                                </span>
                            </div>
                        ) : backgroundImage ? (
                            <>
                                <GradientBackground colors={[backgroundColor ?? 'rgba(0,0,0,0)', '#1A1A1A']} />
                                <img
                                    src={backgroundImage.uri}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute' }}
                                />
                            </>
                        ) : (
                            <div style={{ width: '100%', height: '100%', backgroundColor: '#0d0d0d' }} />
                        )}
                    </div>

                    {/* Tab 切换 */}
                    <div style={{
                        position: 'absolute',
                        top: 16,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 16,
                        zIndex: 10,
                    }}>
                        <button
                            type="button"
                            onClick={ctrl.switchToGenerateTab}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: reactiveState.isGenerateTab ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: 16, fontWeight: 600,
                            }}
                        >
                            AI 生成
                        </button>
                        <button
                            type="button"
                            onClick={ctrl.switchToUploadTab}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: reactiveState.isUploadTab ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: 16, fontWeight: 600,
                            }}
                        >
                            上传图片
                        </button>
                    </div>

                    {/* 底部操作区 */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: 16,
                        zIndex: 10,
                    }}>
                        {reactiveState.isGenerateTab ? (
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 21, justifyContent: 'flex-end' }}>
                                {/* 生成图列表 */}
                                <div style={{ display: 'flex', flexDirection: 'row', gap: 8, overflowX: 'auto', flex: 1 }}>
                                    {reactiveState.generatedImageList.map((img: any) => (
                                        <button
                                            key={img.id}
                                            type="button"
                                            onClick={() => ctrl.selectGeneratedImageById?.(img.id)}
                                            style={{
                                                width: 60, height: 60, borderRadius: 8, overflow: 'hidden',
                                                border: reactiveState.selectGeneratedImage?.id === img.id ? '2px solid #fff' : '2px solid transparent',
                                                background: 'none', cursor: 'pointer', flexShrink: 0, padding: 0,
                                            }}
                                        >
                                            {img.image && <img src={img.image.uri} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={ctrl.applyGeneratedImage}
                                    disabled={!reactiveState.allowApplyGenerated}
                                    style={{
                                        height: 60, width: 109, borderRadius: 12,
                                        backgroundColor: reactiveState.allowApplyGenerated ? '#fff' : 'rgba(255,255,255,0.2)',
                                        color: '#000', fontSize: 16, fontWeight: 600,
                                        border: 'none', cursor: reactiveState.allowApplyGenerated ? 'pointer' : 'default',
                                        flexShrink: 0,
                                    }}
                                >
                                    应用
                                </button>
                            </div>
                        ) : (
                            reactiveState.uploadImage ? (
                                reactiveState.showReUploadButton && (
                                    <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                                        <label style={{
                                            flex: 1, height: 60, borderRadius: 12,
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', color: '#fff', fontSize: 16, fontWeight: 600,
                                        }}>
                                            重新上传
                                            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={ctrl.applyUploadImage}
                                            disabled={!reactiveState.allowApplyUploaded}
                                            style={{
                                                flex: 1, height: 60, borderRadius: 12,
                                                backgroundColor: reactiveState.allowApplyUploaded ? '#fff' : 'rgba(255,255,255,0.2)',
                                                color: '#000', fontSize: 16, fontWeight: 600,
                                                border: 'none', cursor: reactiveState.allowApplyUploaded ? 'pointer' : 'default',
                                            }}
                                        >
                                            应用
                                        </button>
                                    </div>
                                )
                            ) : (
                                <label style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', padding: 16, cursor: 'pointer',
                                }}>
                                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                                        <rect width="60" height="60" rx="12" fill="rgba(255,255,255,0.1)" />
                                        <path d="M20 38l8-10 6 7 4-5 8 8" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="22" cy="24" r="3" fill="rgba(255,255,255,0.6)" />
                                    </svg>
                                    <span style={{ color: '#EDEDED', fontSize: 18, marginTop: 8 }}>从相册选择</span>
                                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                </label>
                            )
                        )}
                    </div>
                </div>
            </RenderParentProvider>
        );
    },
);
