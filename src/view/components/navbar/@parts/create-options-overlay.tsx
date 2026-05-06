import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useInjectRenderController, useReactive } from '$/hooks';
import { Pressable } from '$/uis/primitives';
import { optimize } from '$/view';
import { ASSETS } from '$/consts';
import { NavbarController } from '../navbar-controller';

export const CreateOptionsOverlay = optimize(() => {
    const ctrl = useInjectRenderController(NavbarController);
    const state = useReactive(() => ({ showOverlay: ctrl.state.showOverlay }));

    const handleClose = useCallback(() => ctrl.closeOverlay(), [ctrl]);

    const handleCreateCharacter = useCallback(() => {
        ctrl.closeOverlay();
        ctrl.toCharacterCreate();
    }, [ctrl]);

    const handleCreateStory = useCallback(() => {
        ctrl.closeOverlay();
        ctrl.toStoryCreate();
    }, [ctrl]);

    return (
        <AnimatePresence>
            {state.showOverlay && (
                <motion.div
                    className="fixed inset-0 z-high flex flex-col"
                    style={{ backgroundColor: 'rgba(13,13,13,0.85)', backdropFilter: 'blur(12px)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                >
                    {/* Cards area — flex-end */}
                    <div
                        className="flex flex-col items-center justify-end flex-1 pb-11 gap-3 px-4"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Create character card */}
                        <Pressable
                            onPress={handleCreateCharacter}
                            className="w-full max-w-[358px] h-40 bg-bg-card rounded-3xl flex flex-row items-center px-5 gap-4"
                        >
                            <img src={ASSETS.Logo.createRole} alt="" className="w-20 h-20 object-contain shrink-0" />
                            <div className="flex flex-col gap-1">
                                <span className="text-2xl font-semibold text-text-primary leading-8">绑定角色</span>
                                <span className="text-base font-medium text-text-secondary">同人/原创/家人/玩梗</span>
                            </div>
                        </Pressable>

                        {/* Create story card */}
                        <Pressable
                            onPress={handleCreateStory}
                            className="w-full max-w-[358px] h-40 bg-bg-card rounded-3xl flex flex-row items-center px-5 gap-4"
                        >
                            <img src={ASSETS.Logo.createStory} alt="" className="w-20 h-20 object-contain shrink-0" />
                            <div className="flex flex-col gap-1">
                                <span className="text-2xl font-semibold text-text-primary leading-8">创作故事</span>
                                <span className="text-base font-medium text-text-secondary">同人/原创/家人/玩梗</span>
                            </div>
                        </Pressable>
                    </div>

                    {/* Close button */}
                    <div className="flex justify-center pb-10 shrink-0">
                        <Pressable
                            onPress={handleClose}
                            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-text-primary">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </Pressable>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
