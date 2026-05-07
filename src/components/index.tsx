// @ts-nocheck
// Stub barrel for $/components — exports web-compatible stubs for RN-only components

import type { ReactTypes } from '$/types';
import { optimize } from '$/view';

// ChatInput stub — RN voice/text input, web shows a simple text input
export const ChatInput = optimize(({ onSend, style }: any) => (
    <div style={style} className="flex flex-row gap-2 px-3 py-2 rounded-2xl bg-white/10">
        <input
            type="text"
            className="flex-1 bg-transparent outline-none text-text-primary text-base"
            placeholder="输入回复..."
            onKeyDown={e => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                    onSend?.({ text: e.currentTarget.value });
                    e.currentTarget.value = '';
                }
            }}
        />
    </div>
));

export type ChatInputRef = { focus: () => void };
export type SendVoiceMessageResult = { text: string };

// ScriptWaterfall re-export (actual component)
export { ScriptWaterfall } from './script-waterfall/script-waterfall-ui';

// Character components
export { CharacterMomentCard } from './character-moment-card';
export { CharacterPickList, CharacterCardEnum } from './character-pick-list';
