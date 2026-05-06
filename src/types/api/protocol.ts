/* eslint-disable */
declare module '.' {
    namespace ApiTypes {
        namespace Protocol {
            type SendCodeReq = {
                phone_number: string;
                /** 枚举值请查看api文档 */
                scene: 'login' | 'deregister';
            };
            type SendCodeResp = {
                message: string;
                request_id: string;
                message_ids: string[];
            };
            type VerifyCodeReq = {
                phone_number: string;
                code: string;
                /** 枚举值请查看api文档 */
                scene: 'login' | 'deregister';
                temp_auth_token?: string;
            };
            type VerifyCodeResp = {
                is_valid: boolean;
                message: string;
                request_id?: string;
                jwt_token?: string;
                expires_in?: number;
            };
            type AppleLoginReq = {
                identity_token: string;
                user: string;
                email?: string;
                full_name?: string;
            };
            type JwtTokenEntity = {
                jwt_token: string;
                expires_in: number;
            };
            type AppleLoginResp = {
                token?: JwtTokenEntity;
                auth_token?: string;
            };
            type AppLoginRedirectRequest = {
                code: string;
                state: string;
            };
            type AppLoginRedirectResponse = {
                jwt_token: string;
                expires_in: number;
            };
            type GetTosUploadCredentialReq = {
                expires_in?: number;
            };
            type GetTosUploadCredentialResp = {
                access_key_id: string;
                secret_access_key: string;
                session_token: string;
                bucket: string;
                region: string;
                endpoint: string;
                expires_in: number;
            };
            type TOSObject = {
                bucket_name: string;
                object_key: string;
                object_type: string;
                request_id?: string;
                url?: string;
            };
            type GetImageMainColorReq = {
                image: TOSObject;
            };
            type GetImageMainColorResp = {
                bkg_main_color: string;
            };
            type ProcessImageReq = {
                image_url: string;
            };
            type ProcessImageResp = {
                image_url: string;
            };
            type AuditTextReq = {
                text: string;
            };
            type AuditTextResp = {
                is_passed: boolean;
                message: string;
            };
            type AuditImageReq = {
                audit_url: string;
            };
            type AuditImageResp = {
                passed: boolean;
                msg?: string;
            };
            type ReportAppLogReq = {
                json_data: string;
            };
            type ReportAppLogResp = {};
            type AppTermsResp = {
                user_agreement: string;
                privacy_policy: string;
                xhs: string;
            };
            type AppConfigResp = {
                allow_record_screen: boolean;
            };
            type GetLoadingTipsReq = {};
            type GetLoadingTipsResp = {
                character_loading: string[];
                prologue_loading: string[];
                play_loading: string[];
            };
            type RegisterPushTokenReq = {
                push_token: string;
                push_platform: string;
            };
            type RegisterPushTokenResp = {
                success: boolean;
            };
            type UnregisterPushTokenReq = {};
            type UnregisterPushTokenResp = {
                success: boolean;
            };
            type UpdatePushSettingsReq = {
                push_enabled?: boolean;
                quiet_hours_enabled?: boolean;
            };
            type UpdatePushSettingsResp = {
                success: boolean;
            };
            type GetPushSettingsReq = {};
            type GetPushSettingsResp = {
                push_enabled: boolean;
                quiet_hours_enabled: boolean;
            };
            type ReportPushClickReq = {
                push_log_id: string;
            };
            type ReportPushClickResp = {
                success: boolean;
            };
            type ReportAppStateReq = {
                /** 枚举值请查看api文档 */
                app_state: 'foreground' | 'background';
                /** 枚举值请查看api文档 */
                event_type?:
                    | 'heartbeat'
                    | 'page_enter'
                    | 'page_leave'
                    | 'app_exit';
                page_name?: string;
                page_path?: string;
                session_id?: string;
                client_ts?: number;
                is_exit?: boolean;
            };
            type ReportAppStateResp = {
                success: boolean;
                active_in_last_hour: boolean;
            };
            type CharacterRelation = {
                to_character_name: string;
                relation_name: string;
                relation_desc?: string;
                impression_to_user?: string;
            };
            type Point = {
                x: number;
                y: number;
            };
            type Rect = {
                left_top: Point;
                right_bottom: Point;
            };
            type Media = {
                id: string;
                name?: string;
                url: string;
                width?: number;
                height?: number;
                duration?: number;
                media_type: string;
                desc?: string;
                face?: Rect;
                text?: string;
            };
            type AppearanceStyleItem = {
                style_name: string;
                style_icon: Media;
            };
            type SoulWordOption = {
                soul_word: string;
                soul_word_desc?: string;
                priority?: number;
                center_color?: string;
                transition_color?: string;
                edge_color?: string;
                emotion_resource_id?: string;
                emotion_resource_url?: string;
                highest_evaluations?: string[];
                lowest_evaluations?: string[];
            };
            type CharacterFilterTag = {
                name: string;
                value: number;
            };
            type BodyConfigResp = {
                genders: string[];
                species: string[];
                relationships: CharacterRelation[];
                art_styles: AppearanceStyleItem[];
                soul_words: SoulWordOption[];
                search_tags: CharacterFilterTag[];
            };
            type SoulWordConfig = {
                soul_word: string;
                /** 枚举值请查看api文档 */
                word_type: 1 | 2;
                strength: number;
            };
            type CreateCustomRelation = {
                relation_name: string;
                impression_to_user?: string;
            };
            type BodyConfig = {
                soul_word_configs: SoulWordConfig[];
                gender: string;
                species: string;
                custom_relation?: CreateCustomRelation;
                style_name: string;
                anything_to_add?: string;
            };
            type GenCharacterFromSoulReq = {
                body_config: BodyConfig;
            };
            type CharacterVoice = {
                voice_id?: string;
                icon?: Media;
                sample?: Media;
                voice_name?: string;
                voice_tags?: string[];
            };
            type CharacterBasicInfo = {
                name: string;
                aka: string;
                gender: string;
                species?: string;
                profile: string;
                tag?: string[];
                voice?: CharacterVoice;
                is_public: boolean;
                recognize_others: boolean;
                pre_made_relations?: CharacterRelation[];
                custom_relation?: CharacterRelation;
            };
            type CharacterBasicInfoOutput = {
                basic_info: CharacterBasicInfo;
                bkg_main_color?: string;
                image_show?: Media;
            };
            type GenCharacterFromSoulResp = {
                character: CharacterBasicInfoOutput;
            };
            type ListCopyableCharactersReq = {
                /** 枚举值请查看api文档 */
                tag?: 1 | 2 | 3 | 4;
                keyword?: string;
                cursor?: string;
                limit?: number;
            };
            type CharacterListPageBasicInfo = {
                character_id: string;
                name?: string;
                aka?: string;
                image?: Media;
                bkg_main_color?: string;
                custom_relation?: CharacterRelation;
            };
            type ListCopyableCharactersResp = {
                characters: CharacterListPageBasicInfo[];
                next_cursor: string;
                has_more?: boolean;
            };
            type ListCopyableCharactersTagReq = {};
            type ListCopyableCharactersTagResp = {
                tags: CharacterFilterTag[];
            };
            type GetCharacterDetailReq = {
                character_id: string;
            };
            type CharacterAppearance = {
                appearance_id: string;
                appearance_name: string;
                is_default: boolean;
                in_use: boolean;
                image: Media;
            };
            type CharacterOutfit = {
                outfit_id: string;
                in_use: boolean;
                is_default: boolean;
                bkg_main_color?: string;
                appearances: CharacterAppearance[];
            };
            type CharacterSkill = {
                skill_name: string;
                skill_level: string;
            };
            type CharacterAbility = {
                ability_name: string;
                ability_value: number;
                ability_desc: string;
                ability_emoji: string;
            };
            type UserInfo = {
                uid: string;
                display_uid: string;
                user_name: string;
                is_platform: boolean;
                phone?: string;
            };
            type CharacterDetailInfo = {
                character_id: string;
                name?: string;
                aka?: string;
                gender?: string;
                species?: string;
                profile?: string;
                voice?: CharacterVoice;
                outfits?: CharacterOutfit[];
                current_outfit_id?: string;
                current_appearance_id?: string;
                is_public?: boolean;
                ability_sum: number;
                skills: CharacterSkill[];
                abilities: CharacterAbility[];
                ability_evaluation: string;
                pre_made_relations: CharacterRelation[];
                custom_relation?: CharacterRelation;
                author?: UserInfo;
            };
            type GetCharacterDetailResp = {
                character: CharacterDetailInfo;
            };
            type ListCharacterVoicesReq = {
                gender?: string;
                species?: string;
                cursor?: string;
                limit?: number;
            };
            type ListCharacterVoicesResp = {
                voices: CharacterVoice[];
                next_cursor: string;
                has_more?: boolean;
            };
            type GetCharacterPageConfigReq = {};
            type GetCharacterPageConfigResp = {
                genders: string[];
                relations: string[];
            };
            type ListAppearanceStylesReq = {};
            type ListAppearanceStylesResp = {
                styles: AppearanceStyleItem[];
            };
            type ListEmojisReq = {};
            type EmojiItem = {
                emoji_id: string;
                media: Media;
            };
            type ListEmojisResp = {
                emojis: EmojiItem[];
            };
            type GenAppearanceFromInputReq = {
                description?: string;
                appearance_name?: string;
                style_name?: string;
                character_id?: string;
                outfit_id?: string;
                /** 枚举值请查看api文档 */
                scene?:
                    | 'create_appearance'
                    | 'create_character'
                    | 'create_outfit'
                    | 'update_appearance';
            };
            type GenAppearanceFromInputResp = {
                image: Media;
            };
            type GetGenerationTemporaryAssetReq = {
                /** 枚举值请查看api文档 */
                scene?:
                    | 'create_appearance'
                    | 'create_character'
                    | 'create_outfit'
                    | 'update_appearance';
                character_id?: string;
                outfit_id?: string;
                appearance_id?: string;
            };
            type GenerationTemporaryAsset = {
                asset_id: string;
                media: Media;
            };
            type GetGenerationTemporaryAssetResp = {
                assets?: GenerationTemporaryAsset[];
            };
            type DelGenerationTemporaryAssetReq = {
                asset_ids: string[];
            };
            type DelGenerationTemporaryAssetResp = {};
            type CharacterBasicInfoInput = {
                basic_info: CharacterBasicInfo;
                image_upload?: TOSObject;
                user_upload_image?: TOSObject;
            };
            type CreateCharacterReq = {
                character: CharacterBasicInfoInput;
                soul_word_configs?: SoulWordConfig[];
                source_character_id?: string;
                /** 枚举值请查看api文档 */
                source?: 'character' | 'script';
            };
            type CreateCharacterResp = {
                character_id: string;
                opening_log_id?: string;
            };
            type GetCharacterOpeningLogReq = {
                character_id: string;
                opening_log_id: string;
                next_cursor?: string;
                limit?: number;
            };
            type Scene = {
                scene_name: string;
                background: string;
                background_name?: string;
                music: string;
                scene_desc?: string;
            };
            type NarrativeCompositionSubject = {
                role: string;
                appearance: string;
                role_type?: string;
                effect_names?: string[];
            };
            type NarrativeComposition = {
                layout: string;
                subjects: NarrativeCompositionSubject[];
            };
            type NarrativeAudio = {
                ambient?: string;
                voice_fx?: string;
                tts?: string;
            };
            type NarrativeMaterial = {
                lotties: string[];
                effects: string[];
            };
            type NarrativeInteractionScriptChoice = {
                type: string;
                options: string[];
                kind: string;
            };
            type NarrativeInteractionActionChoiceOption = {
                text: string;
                emotion: string;
                line: string;
            };
            type NarrativeInteractionActionChoice = {
                type: string;
                character: string;
                options: NarrativeInteractionActionChoiceOption[];
            };
            type NarrativeInteractionRhythmTapOptions = {
                action: string;
                required_taps: number;
                time_limit: number;
            };
            type NarrativeInteractionRhythmTap = {
                type: string;
                options?: NarrativeInteractionRhythmTapOptions;
            };
            type NarrativeInteraction = {
                type: string;
                script_choice?: NarrativeInteractionScriptChoice;
                action_choice?: NarrativeInteractionActionChoice;
                rhythm_tap?: NarrativeInteractionRhythmTap;
            };
            type NarrativeEffect = {
                scene?: string[];
            };
            type NarrativeAchievement = {
                /** 枚举值请查看api文档 */
                event_type: 'achievement' | 'ending';
                title: string;
                description: string;
            };
            type Narrative = {
                scene?: Scene;
                narrative_id: string;
                index: string;
                role: string;
                text: string;
                composition?: NarrativeComposition;
                audio?: NarrativeAudio;
                materials?: NarrativeMaterial;
                interaction?: NarrativeInteraction;
                interaction_choice?: string;
                is_last_one_in_scene: boolean;
                effects?: NarrativeEffect;
                act_count: number;
                achievement?: NarrativeAchievement;
                discovered?: string[];
                is_fallback?: boolean;
            };
            type NarrativeResBackground = {
                id: string;
                name: string;
                desc: string;
                images?: Media[];
                audio?: Media;
                video?: Media;
                frame_rate?: number;
                filter_preset?: string;
                brightness?: number;
                blur_level?: number;
                loop?: boolean;
                scale?: number;
            };
            type NarrativeResMusic = {
                id: string;
                voice_media: Media;
                default_volume?: number;
                speed?: number;
            };
            type NarrativeResLayout = {
                id: string;
                layout_media?: Media;
                json: string;
            };
            type NarrativeResAmbient = {
                id: string;
                voice_media: Media;
                is_loop: boolean;
                is_inherit_next_frame?: boolean;
                default_volume?: number;
                speed?: number;
            };
            type NarrativeResVoiceFX = {
                id: string;
                voice_media: Media;
                is_loop: boolean;
                is_inherit_next_frame?: boolean;
                default_volume?: number;
                speed?: number;
            };
            type NarrativeResEffectFrame = {
                id: string;
                name: string;
                images?: Media[];
                frame_rate?: number;
                loop?: boolean;
            };
            type NarrativeResEffectCodeKey = {
                effect_name: string;
                props: string;
            };
            type NarrativeResLottie = {
                id: string;
                lottie_media: Media;
            };
            type NarrativeResEffectMotion = {
                name: string;
                props: string;
            };
            type NarrativeResEffect = {
                id: string;
                effect_type: number;
                frames?: NarrativeResEffectFrame;
                effect_code?: NarrativeResEffectCodeKey;
                lottie?: NarrativeResLottie;
                motion?: NarrativeResEffectMotion;
            };
            type NarrativeResTTS = {
                id: string;
                voice_media: Media;
                is_loop?: boolean;
                is_inherit_next_frame?: boolean;
                default_volume?: number;
                speed?: number;
            };
            type NarrativeResAppearance = {
                id: string;
                scale?: number;
                appearance_media: Media;
            };
            type NarrativeResCharacter = {
                character_id: string;
                play_role_id: string;
                role_name: string;
                role_identities?: string[];
                character_name: string;
                aka: string;
                gender: string;
                species: string;
                is_me: boolean;
            };
            type NarrativeResource = {
                background: NarrativeResBackground[];
                music: NarrativeResMusic[];
                layout: NarrativeResLayout[];
                ambient: NarrativeResAmbient[];
                voice_fx: NarrativeResVoiceFX[];
                effect: NarrativeResEffect[];
                tts: NarrativeResTTS[];
                character_appearances: NarrativeResAppearance[];
                characters: NarrativeResCharacter[];
            };
            type GetCharacterOpeningLogResp = {
                has_more: boolean;
                next_cursor: string;
                narratives: Narrative[];
                resource: NarrativeResource;
            };
            type ListUserCharactersReq = {
                current_time?: string;
                cursor?: string;
                limit?: number;
            };
            type CharacterStatus = {
                character_state?: string;
                character_loc?: string;
                character_loc_bkg?: Media;
                bkg_main_color?: string;
                current_outfit_id?: string;
                current_appearance_name?: string;
                current_appearance_media?: Media;
            };
            type CharacterSchedule = {
                schedule_id: string;
                character_id?: string;
                schedule_name?: string;
                schedule_start_time?: string;
                schedule_end_time?: string;
                event_type?: string;
                character_state?: string;
                character_loc?: string;
                character_loc_bkg?: Media;
                current_outfit_id?: string;
                current_appearance_name?: string;
                detail?: string;
                viewed?: boolean;
                has_paid?: number;
            };
            type PhoneMessageText = {
                text: string;
            };
            type PhoneMessageVoice = {
                voice: Media;
                text?: string;
            };
            type PhoneMessageImage = {
                image: Media;
            };
            type PhoneMessageEmoji = {
                emoji_id: string;
                media?: Media;
            };
            type GiftImage = {
                type: string;
                media?: Media;
                emoji_id?: string;
            };
            type PhoneMessageGift = {
                name: string;
                description: string;
                price: number;
                image: GiftImage;
                status: string;
            };
            type PhoneMessageInvitation = {
                invitation_id: string;
                schedule_id?: string;
                title?: string;
                description?: string;
                button_label?: string;
                location?: string;
                location_id?: string;
                outfit?: string;
                emotion?: string;
                status?: string;
            };
            type PhoneMessageHtml = {
                html_file: Media;
            };
            type PhoneMessageOutput = {
                message_id?: string;
                msg_type: string;
                msg_direction?: string;
                is_failed?: boolean;
                text?: PhoneMessageText;
                voice?: PhoneMessageVoice;
                image?: PhoneMessageImage;
                emoji?: PhoneMessageEmoji;
                gift?: PhoneMessageGift;
                invitation?: PhoneMessageInvitation;
                html_file?: PhoneMessageHtml;
                is_read?: boolean;
                is_click?: boolean;
                created_at?: number;
                cursor?: string;
            };
            type CharacterPageBasicInfo = {
                basic_info: CharacterListPageBasicInfo;
                character_status: CharacterStatus;
                current_schedule?: CharacterSchedule;
                latest_message?: PhoneMessageOutput;
                unread_count: number;
                relation_tag?: string;
                scale?: number;
            };
            type ListUserCharactersResp = {
                characters: CharacterPageBasicInfo[];
                max_characters: number;
                next_cursor: string;
                has_more?: boolean;
            };
            type ListCharacterPhoneChatHistoryReq = {
                character_id: string;
                cursor?: string;
                /** 枚举值请查看api文档 */
                direction?: 'up' | 'down';
                /** 枚举值请查看api文档 */
                order_by?: 'desc' | 'asc';
                limit?: number;
                last_message_id?: string;
                start_time?: string;
                end_time?: string;
            };
            type ListCharacterPhoneChatHistoryResp = {
                msgs: PhoneMessageOutput[];
                min_cursor: string;
                max_cursor: string;
                up_has_more: boolean;
                down_has_more: boolean;
            };
            type PhoneMessageTextInput = {
                text: string;
            };
            type PhoneMessageVoiceInput = {
                voice: Media;
                text?: string;
            };
            type PhoneMessageImageInput = {
                image: Media;
            };
            type GiftImageInput = {
                type: string;
                media?: Media;
                emoji_id?: string;
            };
            type PhoneMessageGiftInput = {
                name: string;
                description: string;
                price: number;
                image: GiftImageInput;
                status: string;
            };
            type PhoneMessageInput = {
                msg_type: string;
                text?: PhoneMessageTextInput;
                voice?: PhoneMessageVoiceInput;
                image?: PhoneMessageImageInput;
                emoji?: PhoneMessageEmoji;
                gift?: PhoneMessageGiftInput;
                invitation?: PhoneMessageInvitation;
            };
            type ChatWithCharacterReq = {
                character_id: string;
                /** 枚举值请查看api文档 */
                chat_scene: 1 | 2 | 3;
                schedule_id?: string;
                resend_message_id?: string;
                messages: PhoneMessageInput[];
            };
            type ChatWithCharacterResp = {
                current_messages: PhoneMessageOutput[];
                character_messages?: PhoneMessageOutput[];
                character_status: CharacterStatus;
            };
            type listCharacterScheduleByDayReq = {
                character_id: string;
                current_time: string;
            };
            type listCharacterScheduleByDayResp = {
                schedules: CharacterSchedule[];
            };
            type GenerateCharacterScheduleReq = {
                character_id: string;
                date: string;
            };
            type GenerateCharacterScheduleResp = {};
            type UpdateScheduleViewedStatusReq = {
                schedule_ids: string[];
                view_status?: boolean;
            };
            type UpdateScheduleViewedStatusResp = {};
            type UpdateMessageReadStatusReq = {
                character_id: string;
                msg_id: string;
                is_read?: boolean;
            };
            type UpdateMessageReadStatusResp = {};
            type UpdateMessageClickStatusReq = {
                character_id: string;
                msg_id: string;
                is_click?: boolean;
            };
            type UpdateMessageClickStatusResp = {};
            type MemoryRollbackReq = {
                character_id: string;
                msg_id: string;
            };
            type MemoryRollbackResp = {};
            type PlayInvitationReq = {
                character_id: string;
                message_id: string;
                user_message?: string;
            };
            type PlayInvitationResp = {
                success: boolean;
                invitation_id: string;
            };
            type QueryInvitationReq = {
                invitation_id: string;
                next_cursor?: string;
                limit?: number;
            };
            type QueryInvitationResp = {
                has_more: boolean;
                next_cursor: string;
                narratives: Narrative[];
                resource: NarrativeResource;
            };
            type UpdateCharacterBasicInfoReq = {
                character_id: string;
                character_info: CharacterBasicInfoInput;
            };
            type UpdateCharacterBasicInfoResp = {};
            type DeleteCharacterReq = {
                character_id: string;
                delete_type?: number;
                reason?: string;
            };
            type DeleteCharacterResp = {};
            type CreateAppearanceReq = {
                character_id: string;
                outfit_id?: string;
                appearance_name: string;
                image: TOSObject;
                desc?: string;
                user_upload_image?: TOSObject;
            };
            type CreateAppearanceResp = {
                outfit_id: string;
                appearance_id: string;
            };
            type UpdateAppearanceReq = {
                character_id: string;
                outfit_id: string;
                appearance_id: string;
                desc?: string;
                image?: TOSObject;
                user_upload_image?: TOSObject;
            };
            type UpdateAppearanceResp = {};
            type SwitchOutfitReq = {
                character_id: string;
                outfit_id: string;
            };
            type SwitchOutfitResp = {};
            type ListCharacterAppearancesReq = {
                character_id: string;
            };
            type ListCharacterAppearancesResp = {
                outfits: CharacterOutfit[];
            };
            type SoulWordAbilityInput = {
                ability_name: string;
                ability_value: number;
            };
            type GetSoulWordEvaluationReq = {
                abilities: SoulWordAbilityInput[];
            };
            type GetSoulWordEvaluationResp = {
                evaluation: string;
            };
            type ListSelectableCharacterRoleFilter = {
                role_identity?: string;
                script_types: string[];
            };
            type ListSelectableCharacterReq = {
                query?: string;
                role_filter?: ListSelectableCharacterRoleFilter;
                cursor?: string;
                limit?: number;
            };
            type CharacterShowInfo = {
                character_id: string;
                outfit_id?: string;
                is_owner?: boolean;
                /** 枚举值请查看api文档 */
                create_source: 'character' | 'script';
                name?: string;
                aka?: string;
                image?: Media;
                bkg_main_color?: string;
                author?: UserInfo;
            };
            type ListSelectableCharacterResp = {
                lists: CharacterShowInfo[];
                next_cursor: string;
                has_more?: boolean;
            };
            type ScriptRole = {
                identities: string[];
                background?: string;
                extra_background?: string;
                goal?: string;
                secret?: string;
                character_info?: CharacterShowInfo;
                role_id?: string;
            };
            type ScriptInputEntity = {
                title: string;
                /** 枚举值请查看api文档 */
                role_arrangement_type: 1 | 2;
                story: string;
                story_types: string[];
                opening_story?: string;
                story_flow?: string[];
                fixed_roles?: ScriptRole[];
                tbd_roles?: ScriptRole[];
                npc_roles?: ScriptRole[];
                script_scene_tags?: string[];
            };
            type CreateScriptReq = {
                script_info: ScriptInputEntity;
            };
            type CreateScriptResp = {
                script_id: string;
                version: string;
            };
            type UpdateScriptReq = {
                script_id: string;
                version: string;
                script_info: ScriptInputEntity;
            };
            type UpdateScriptResp = {
                script_id: string;
                version: string;
            };
            type PublishScriptReq = {
                script_id: string;
                version: string;
            };
            type PublishScriptResp = {
                script_id: string;
                version: string;
            };
            type DeleteScriptDraftReq = {
                script_id: string;
                version: string;
            };
            type DeleteScriptDraftResp = {};
            type ListScriptTypesResp = {
                types: string[];
            };
            type ScriptDetailReq = {
                script_id: string;
                version?: string;
            };
            type ScriptDetailResp = {
                script_id: string;
                version: string;
                /** 枚举值请查看api文档 */
                status: 'published' | 'publishing' | 'rejected' | 'draft';
                author: UserInfo;
                title: string;
                /** 枚举值请查看api文档 */
                role_arrangement_type: 1 | 2;
                story: string;
                story_types: string[];
                opening_story?: string;
                story_flow?: string[];
                fixed_roles: ScriptRole[];
                tbd_roles: ScriptRole[];
                npc_roles: ScriptRole[];
                active_play_id?: string;
                active_play_role_id?: string;
                last_bkg_in_opl: Media;
            };
            type SetPGCBackgroundReq = {
                script_id: string;
                version?: string;
                tos_link: string;
            };
            type SetPGCBackgroundResp = {};
            type ReportScriptEntity = {
                impression_id: string;
                script_id: string;
            };
            type ReportScriptsReq = {
                list: ReportScriptEntity[];
                /** 枚举值请查看api文档 */
                source: 'world' | 'rec' | 'play_with';
                /** 枚举值请查看api文档 */
                action: 'show' | 'click';
            };
            type ReportScriptsResp = {};
            type SearchScriptsReq = {
                character_id?: string;
                keyword?: string;
                next_cursor?: string;
                limit?: number;
            };
            type ScriptEntity = {
                impression_id?: string;
                script_id: string;
                script_opening_id: string;
                title: string;
                tags: string[];
                corner_tag: string;
                /** 枚举值请查看api文档 */
                corner_tag_style?: 1 | 2 | 3 | 4;
                pgc_bkg_media: Media;
                bkg_media?: Media;
                bkg_main_color?: string;
                appearance_medias?: Media[];
                is_favourite: boolean;
                active_play_id: string;
                active_play_role_id?: string;
                /** 枚举值请查看api文档 */
                status: 'published' | 'publishing' | 'rejected' | 'draft';
                version: string;
                draft_version?: string;
                /** 枚举值请查看api文档 */
                draft_status?:
                    | 'published'
                    | 'publishing'
                    | 'rejected'
                    | 'draft';
                last_published_version?: string;
                publish_time?: number;
                update_time?: number;
                favourite_time?: number;
                last_play_time?: number;
            };
            type SearchScriptsResp = {
                request_id: string;
                list: ScriptEntity[];
                has_more: boolean;
                next_cursor: string;
            };
            type GetSearchHintReq = {};
            type GetSearchHintResp = {
                text: string;
            };
            type FavouriteScriptReq = {
                script_id: string;
            };
            type FavouriteScriptResp = {};
            type UnfavouriteScriptReq = {
                script_id: string;
            };
            type UnfavouriteScriptResp = {};
            type ListPlayWithCharactersReq = {};
            type PlayWithEntity = {
                character_id: string;
                appearance: Media;
            };
            type ListPlayWithCharactersResp = {
                list: PlayWithEntity[];
            };
            type GetFeedTagsReq = {};
            type FeedSceneTag = {
                index: number;
                tag_name: string;
            };
            type GetFeedTagsResp = {
                tags: FeedSceneTag[];
            };
            type RecFeedScriptWorldFilter = {
                tag: FeedSceneTag;
            };
            type RecFeedScriptPlayWithFilter = {
                character_id: string;
            };
            type RecFeedScriptsReq = {
                world_filter?: RecFeedScriptWorldFilter;
                play_with_filter?: RecFeedScriptPlayWithFilter;
                /** 枚举值请查看api文档 */
                source: 'world' | 'rec' | 'play_with';
                exclude_ids?: string[];
                limit?: number;
            };
            type RecFeedScriptResp = {
                request_id: string;
                list: ScriptEntity[];
            };
            type QueryScriptOpeningReq = {
                script_opening_id: string;
                next_cursor?: string;
                limit?: number;
            };
            type QueryScriptOpeningResp = {
                has_more: boolean;
                next_cursor: string;
                narratives: Narrative[];
                resource: NarrativeResource;
            };
            type PrefetchReqEntity = {
                script_id: string;
                version: string;
                active_play_id?: string;
            };
            type PrefetchResourcesReq = {
                lists: PrefetchReqEntity[];
            };
            type PrefetchRespEntity = {
                script_id: string;
                version: string;
                active_play_id?: string;
                background_medias: Media[];
                music_medias: Media[];
                layout_medias: Media[];
                ambient_medias: Media[];
                voice_fx_medias: Media[];
                effect_medias: Media[];
                tts_medias: Media[];
                appearance_medias: Media[];
            };
            type PrefetchResourcesResp = {
                lists: PrefetchRespEntity[];
            };
            type StartPlayReq = {
                script_id: string;
                selected_role_id?: string;
                selected_temp_role_id?: string;
                added_roles?: ScriptRole[];
                tbd_role_binds?: ScriptRole[];
                deprecate_play_id?: string;
            };
            type StartPlayResp = {
                play_id: string;
            };
            type QueryPlayNextReq = {
                play_id: string;
                next_cursor?: string;
                limit?: number;
            };
            type QueryPlayNextResp = {
                has_more: boolean;
                next_cursor: string;
                narratives: Narrative[];
                resource: NarrativeResource;
            };
            type ContinuePlayReq = {
                play_id: string;
                narrative_id: string;
                user_response: string;
                /** 枚举值请查看api文档 */
                response_type?: 1 | 2;
            };
            type ContinuePlayResp = {
                play_id: string;
                next_cursor: string;
            };
            type ReportPlayedNarrativeIdReq = {
                play_id: string;
                narrative_id: string;
            };
            type ReportPlayedNarrativeIdResp = {};
            type QueryPlayLastCursorReq = {
                play_id: string;
            };
            type QueryPlayLastCursorResp = {
                play_id: string;
                next_cursor: string;
            };
            type PlayActListReq = {
                play_id: string;
                limit?: number;
                cursor?: string;
            };
            type HistoryPlayActEntity = {
                play_act_id: string;
                act_title: string;
                bkg_media: Media;
            };
            type PlayActListResp = {
                list: HistoryPlayActEntity[];
                total_count: number;
                next_cursor: string;
                has_more: boolean;
            };
            type ReplayFromNarrativeReq = {
                play_id: string;
                narrative_id: string;
                user_message: string;
            };
            type ReplayFromNarrativeResp = {
                play_id: string;
                next_cursor: string;
            };
            type QueryActNarrativesReq = {
                play_act_id: string;
            };
            type QueryActNarrativesResp = {
                narratives: Narrative[];
                resource: NarrativeResource;
            };
            type QueryAchievementAppearanceReq = {
                play_id: string;
                narrative_id: string;
            };
            type QueryAchievementAppearanceResp = {
                appearances: CharacterAppearance[];
            };
            type DeleteUserPlayReq = {
                play_id: string;
            };
            type DeleteUserPlayResp = {};
            type QueryHistoryNarrativeTextReq = {
                /** 枚举值请查看api文档 */
                scene: 'opening' | 'play';
                current_narrative_id: string;
                limit?: number;
            };
            type HistoryNarrative = {
                chapter_id: string;
                chapter_name: string;
                narrative_id: string;
                index: string;
                chapter_desc?: string;
                text: string;
                role: string;
                is_me: boolean;
                interaction_choice?: string;
            };
            type QueryHistoryNarrativeTextResp = {
                list: HistoryNarrative[];
                next_narrative_id: string;
                has_more: boolean;
            };
            type ListFavouriteScriptsReq = {
                cursor?: string;
                limit?: number;
            };
            type ListFavouriteScriptsResp = {
                scripts: ScriptEntity[];
                next_cursor: string;
                has_more?: boolean;
            };
            type GetUserInfoReq = {
                uid?: string;
            };
            type GetUserInfoResp = {
                info: UserInfo;
            };
            type UpdateUserInfoReq = {
                user_name?: string;
            };
            type UpdateUserInfoResp = {};
            type GetUserHomePageStatReq = {};
            type GetUserHomePageStatResp = {
                played_script_count: number;
                created_script_count: number;
                draft_script_count: number;
                favourite_script_count: number;
                memory_count: number;
            };
            type GetUserPlayHistoryReq = {
                limit?: number;
                cursor?: string;
            };
            type PlayAchievement = {
                title: string;
                count: number;
                /** 枚举值请查看api文档 */
                event: 'ending' | 'achievement';
            };
            type PlayEntity = {
                play_id: string;
                title: string;
                tags: string[];
                corner_tag: string;
                bkg_media?: Media;
                bkg_main_color?: string;
                appearance_medias?: Media[];
                act_count: number;
                achievements: PlayAchievement[];
                script_id: string;
                version: string;
                play_role_id?: string;
                last_play_time?: number;
            };
            type GetUserPlayHistoryResp = {
                list: PlayEntity[];
                has_more: boolean;
                next_cursor?: string;
            };
            type GetUserScriptsReq = {
                limit?: number;
                cursor?: string;
                /** 枚举值请查看api文档 */
                status: 'published' | 'draft';
            };
            type GetUserScriptsResp = {
                list: ScriptEntity[];
                has_more: boolean;
                next_cursor: string;
            };
            type DemoListScriptsResp = {
                lists: ScriptEntity[];
            };
            type DemoRefreshScriptOpeningReq = {
                script_id: string;
            };
            type DemoRefreshScriptOpeningResp = {};
        }

        type Protocol = {
            auth: {
                send_code: ProtocolStruct<{
                    req: Protocol.SendCodeReq;
                    res: Protocol.SendCodeResp;
                }>;
                verify_code: ProtocolStruct<{
                    req: Protocol.VerifyCodeReq;
                    res: Protocol.VerifyCodeResp;
                }>;
                apple_login: ProtocolStruct<{
                    req: Protocol.AppleLoginReq;
                    res: Protocol.AppleLoginResp;
                }>;
                app_login_redirect: ProtocolStruct<{
                    req: Protocol.AppLoginRedirectRequest;
                    res: Protocol.AppLoginRedirectResponse;
                }>;
            };
            file: {
                tos_credential: ProtocolStruct<{
                    req: Protocol.GetTosUploadCredentialReq;
                    res: Protocol.GetTosUploadCredentialResp;
                }>;
                image_main_color: ProtocolStruct<{
                    req: Protocol.GetImageMainColorReq;
                    res: Protocol.GetImageMainColorResp;
                }>;
                process_image: ProtocolStruct<{
                    req: Protocol.ProcessImageReq;
                    res: Protocol.ProcessImageResp;
                }>;
            };
            audit: {
                text: ProtocolStruct<{
                    req: Protocol.AuditTextReq;
                    res: Protocol.AuditTextResp;
                }>;
                image: ProtocolStruct<{
                    req: Protocol.AuditImageReq;
                    res: Protocol.AuditImageResp;
                }>;
            };
            report: {
                app_log: ProtocolStruct<{
                    req: Protocol.ReportAppLogReq;
                    res: Protocol.ReportAppLogResp;
                }>;
            };
            app: {
                get_terms: ProtocolStruct<{
                    req: null;
                    res: Protocol.AppTermsResp;
                }>;
                config: ProtocolStruct<{
                    req: null;
                    res: Protocol.AppConfigResp;
                }>;
                get_loading_tips: ProtocolStruct<{
                    req: Protocol.GetLoadingTipsReq;
                    res: Protocol.GetLoadingTipsResp;
                }>;
                register_push_token: ProtocolStruct<{
                    req: Protocol.RegisterPushTokenReq;
                    res: Protocol.RegisterPushTokenResp;
                }>;
                unregister_push_token: ProtocolStruct<{
                    req: Protocol.UnregisterPushTokenReq;
                    res: Protocol.UnregisterPushTokenResp;
                }>;
                update_push_settings: ProtocolStruct<{
                    req: Protocol.UpdatePushSettingsReq;
                    res: Protocol.UpdatePushSettingsResp;
                }>;
                get_push_settings: ProtocolStruct<{
                    req: Protocol.GetPushSettingsReq;
                    res: Protocol.GetPushSettingsResp;
                }>;
                report_push_click: ProtocolStruct<{
                    req: Protocol.ReportPushClickReq;
                    res: Protocol.ReportPushClickResp;
                }>;
                report_app_state: ProtocolStruct<{
                    req: Protocol.ReportAppStateReq;
                    res: Protocol.ReportAppStateResp;
                }>;
            };
            character: {
                body_config: ProtocolStruct<{
                    req: null;
                    res: Protocol.BodyConfigResp;
                }>;
                gen_from_soul: ProtocolStruct<{
                    req: Protocol.GenCharacterFromSoulReq;
                    res: Protocol.GenCharacterFromSoulResp;
                }>;
                list_copyable_characters: ProtocolStruct<{
                    req: Protocol.ListCopyableCharactersReq;
                    res: Protocol.ListCopyableCharactersResp;
                }>;
                list_copyable_characters_tag: ProtocolStruct<{
                    req: Protocol.ListCopyableCharactersTagReq;
                    res: Protocol.ListCopyableCharactersTagResp;
                }>;
                detail: ProtocolStruct<{
                    req: Protocol.GetCharacterDetailReq;
                    res: Protocol.GetCharacterDetailResp;
                }>;
                list_character_voices: ProtocolStruct<{
                    req: Protocol.ListCharacterVoicesReq;
                    res: Protocol.ListCharacterVoicesResp;
                }>;
                page_config: ProtocolStruct<{
                    req: Protocol.GetCharacterPageConfigReq;
                    res: Protocol.GetCharacterPageConfigResp;
                }>;
                list_appearance_styles: ProtocolStruct<{
                    req: Protocol.ListAppearanceStylesReq;
                    res: Protocol.ListAppearanceStylesResp;
                }>;
                list_emojis: ProtocolStruct<{
                    req: Protocol.ListEmojisReq;
                    res: Protocol.ListEmojisResp;
                }>;
                gen_appearance: ProtocolStruct<{
                    req: Protocol.GenAppearanceFromInputReq;
                    res: Protocol.GenAppearanceFromInputResp;
                }>;
                get_generation_temp_asset: ProtocolStruct<{
                    req: Protocol.GetGenerationTemporaryAssetReq;
                    res: Protocol.GetGenerationTemporaryAssetResp;
                }>;
                del_generation_temp_asset: ProtocolStruct<{
                    req: Protocol.DelGenerationTemporaryAssetReq;
                    res: Protocol.DelGenerationTemporaryAssetResp;
                }>;
                create: ProtocolStruct<{
                    req: Protocol.CreateCharacterReq;
                    res: Protocol.CreateCharacterResp;
                }>;
                get_character_opening_log: ProtocolStruct<{
                    req: Protocol.GetCharacterOpeningLogReq;
                    res: Protocol.GetCharacterOpeningLogResp;
                }>;
                list_my_characters: ProtocolStruct<{
                    req: Protocol.ListUserCharactersReq;
                    res: Protocol.ListUserCharactersResp;
                }>;
                list_phone_chat_history: ProtocolStruct<{
                    req: Protocol.ListCharacterPhoneChatHistoryReq;
                    res: Protocol.ListCharacterPhoneChatHistoryResp;
                }>;
                chat_with_character: ProtocolStruct<{
                    req: Protocol.ChatWithCharacterReq;
                    res: Protocol.ChatWithCharacterResp;
                }>;
                list_schedule_by_day: ProtocolStruct<{
                    req: Protocol.listCharacterScheduleByDayReq;
                    res: Protocol.listCharacterScheduleByDayResp;
                }>;
                generate_schedule: ProtocolStruct<{
                    req: Protocol.GenerateCharacterScheduleReq;
                    res: Protocol.GenerateCharacterScheduleResp;
                }>;
                update_schedule_viewed_status: ProtocolStruct<{
                    req: Protocol.UpdateScheduleViewedStatusReq;
                    res: Protocol.UpdateScheduleViewedStatusResp;
                }>;
                update_message_read_status: ProtocolStruct<{
                    req: Protocol.UpdateMessageReadStatusReq;
                    res: Protocol.UpdateMessageReadStatusResp;
                }>;
                update_message_click_status: ProtocolStruct<{
                    req: Protocol.UpdateMessageClickStatusReq;
                    res: Protocol.UpdateMessageClickStatusResp;
                }>;
                memory_rollback: ProtocolStruct<{
                    req: Protocol.MemoryRollbackReq;
                    res: Protocol.MemoryRollbackResp;
                }>;
                play_invitation: ProtocolStruct<{
                    req: Protocol.PlayInvitationReq;
                    res: Protocol.PlayInvitationResp;
                }>;
                query_invitation: ProtocolStruct<{
                    req: Protocol.QueryInvitationReq;
                    res: Protocol.QueryInvitationResp;
                }>;
                updateBasicInfo: ProtocolStruct<{
                    req: Protocol.UpdateCharacterBasicInfoReq;
                    res: Protocol.UpdateCharacterBasicInfoResp;
                }>;
                delete: ProtocolStruct<{
                    req: Protocol.DeleteCharacterReq;
                    res: Protocol.DeleteCharacterResp;
                }>;
                create_appearance: ProtocolStruct<{
                    req: Protocol.CreateAppearanceReq;
                    res: Protocol.CreateAppearanceResp;
                }>;
                update_appearance: ProtocolStruct<{
                    req: Protocol.UpdateAppearanceReq;
                    res: Protocol.UpdateAppearanceResp;
                }>;
                switch_outfit: ProtocolStruct<{
                    req: Protocol.SwitchOutfitReq;
                    res: Protocol.SwitchOutfitResp;
                }>;
                list_appearances: ProtocolStruct<{
                    req: Protocol.ListCharacterAppearancesReq;
                    res: Protocol.ListCharacterAppearancesResp;
                }>;
                get_soul_word_evaluation: ProtocolStruct<{
                    req: Protocol.GetSoulWordEvaluationReq;
                    res: Protocol.GetSoulWordEvaluationResp;
                }>;
            };
            script: {
                list_selectable_characters: ProtocolStruct<{
                    req: Protocol.ListSelectableCharacterReq;
                    res: Protocol.ListSelectableCharacterResp;
                }>;
                create: ProtocolStruct<{
                    req: Protocol.CreateScriptReq;
                    res: Protocol.CreateScriptResp;
                }>;
                update: ProtocolStruct<{
                    req: Protocol.UpdateScriptReq;
                    res: Protocol.UpdateScriptResp;
                }>;
                publish: ProtocolStruct<{
                    req: Protocol.PublishScriptReq;
                    res: Protocol.PublishScriptResp;
                }>;
                delete_draft: ProtocolStruct<{
                    req: Protocol.DeleteScriptDraftReq;
                    res: Protocol.DeleteScriptDraftResp;
                }>;
                list_script_types: ProtocolStruct<{
                    req: null;
                    res: Protocol.ListScriptTypesResp;
                }>;
                detail: ProtocolStruct<{
                    req: Protocol.ScriptDetailReq;
                    res: Protocol.ScriptDetailResp;
                }>;
                set_pgc_background: ProtocolStruct<{
                    req: Protocol.SetPGCBackgroundReq;
                    res: Protocol.SetPGCBackgroundResp;
                }>;
            };
            feed: {
                report: ProtocolStruct<{
                    req: Protocol.ReportScriptsReq;
                    res: Protocol.ReportScriptsResp;
                }>;
                search_scripts: ProtocolStruct<{
                    req: Protocol.SearchScriptsReq;
                    res: Protocol.SearchScriptsResp;
                }>;
                get_search_hint: ProtocolStruct<{
                    req: Protocol.GetSearchHintReq;
                    res: Protocol.GetSearchHintResp;
                }>;
                favourite_script: ProtocolStruct<{
                    req: Protocol.FavouriteScriptReq;
                    res: Protocol.FavouriteScriptResp;
                }>;
                unfavourite_script: ProtocolStruct<{
                    req: Protocol.UnfavouriteScriptReq;
                    res: Protocol.UnfavouriteScriptResp;
                }>;
                list_play_with_characters: ProtocolStruct<{
                    req: Protocol.ListPlayWithCharactersReq;
                    res: Protocol.ListPlayWithCharactersResp;
                }>;
                tags: ProtocolStruct<{
                    req: Protocol.GetFeedTagsReq;
                    res: Protocol.GetFeedTagsResp;
                }>;
                rec_scripts: ProtocolStruct<{
                    req: Protocol.RecFeedScriptsReq;
                    res: Protocol.RecFeedScriptResp;
                }>;
            };
            play: {
                query_script_opening: ProtocolStruct<{
                    req: Protocol.QueryScriptOpeningReq;
                    res: Protocol.QueryScriptOpeningResp;
                }>;
                prefetch_resources: ProtocolStruct<{
                    req: Protocol.PrefetchResourcesReq;
                    res: Protocol.PrefetchResourcesResp;
                }>;
                script_detail: ProtocolStruct<{
                    req: Protocol.ScriptDetailReq;
                    res: Protocol.ScriptDetailResp;
                }>;
                start: ProtocolStruct<{
                    req: Protocol.StartPlayReq;
                    res: Protocol.StartPlayResp;
                }>;
                query_next: ProtocolStruct<{
                    req: Protocol.QueryPlayNextReq;
                    res: Protocol.QueryPlayNextResp;
                }>;
                continue: ProtocolStruct<{
                    req: Protocol.ContinuePlayReq;
                    res: Protocol.ContinuePlayResp;
                }>;
                report_played_narrative_id: ProtocolStruct<{
                    req: Protocol.ReportPlayedNarrativeIdReq;
                    res: Protocol.ReportPlayedNarrativeIdResp;
                }>;
                query_last_cursor: ProtocolStruct<{
                    req: Protocol.QueryPlayLastCursorReq;
                    res: Protocol.QueryPlayLastCursorResp;
                }>;
                list_acts: ProtocolStruct<{
                    req: Protocol.PlayActListReq;
                    res: Protocol.PlayActListResp;
                }>;
                replay_from_narrative: ProtocolStruct<{
                    req: Protocol.ReplayFromNarrativeReq;
                    res: Protocol.ReplayFromNarrativeResp;
                }>;
                query_act_narratives: ProtocolStruct<{
                    req: Protocol.QueryActNarrativesReq;
                    res: Protocol.QueryActNarrativesResp;
                }>;
                query_achievement_appearance: ProtocolStruct<{
                    req: Protocol.QueryAchievementAppearanceReq;
                    res: Protocol.QueryAchievementAppearanceResp;
                }>;
                delete: ProtocolStruct<{
                    req: Protocol.DeleteUserPlayReq;
                    res: Protocol.DeleteUserPlayResp;
                }>;
                query_history_narrative_text: ProtocolStruct<{
                    req: Protocol.QueryHistoryNarrativeTextReq;
                    res: Protocol.QueryHistoryNarrativeTextResp;
                }>;
            };
            user: {
                list_favourite_scripts: ProtocolStruct<{
                    req: Protocol.ListFavouriteScriptsReq;
                    res: Protocol.ListFavouriteScriptsResp;
                }>;
                get_user_info: ProtocolStruct<{
                    req: Protocol.GetUserInfoReq;
                    res: Protocol.GetUserInfoResp;
                }>;
                update_user_info: ProtocolStruct<{
                    req: Protocol.UpdateUserInfoReq;
                    res: Protocol.UpdateUserInfoResp;
                }>;
                get_home_page_stat: ProtocolStruct<{
                    req: Protocol.GetUserHomePageStatReq;
                    res: Protocol.GetUserHomePageStatResp;
                }>;
                play_history: ProtocolStruct<{
                    req: Protocol.GetUserPlayHistoryReq;
                    res: Protocol.GetUserPlayHistoryResp;
                }>;
                get_user_scripts: ProtocolStruct<{
                    req: Protocol.GetUserScriptsReq;
                    res: Protocol.GetUserScriptsResp;
                }>;
            };
            guest: {
                feed_tags: ProtocolStruct<{
                    req: Protocol.GetFeedTagsReq;
                    res: Protocol.GetFeedTagsResp;
                }>;
                feed_rec_scripts: ProtocolStruct<{
                    req: Protocol.RecFeedScriptsReq;
                    res: Protocol.RecFeedScriptResp;
                }>;
                query_script_opening: ProtocolStruct<{
                    req: Protocol.QueryScriptOpeningReq;
                    res: Protocol.QueryScriptOpeningResp;
                }>;
            };
            internal: {
                demo_list_scripts: ProtocolStruct<{
                    req: null;
                    res: Protocol.DemoListScriptsResp;
                }>;
                demo_script_detail: ProtocolStruct<{
                    req: Protocol.ScriptDetailReq;
                    res: Protocol.ScriptDetailResp;
                }>;
                demo_start_script: ProtocolStruct<{
                    req: Protocol.StartPlayReq;
                    res: Protocol.StartPlayResp;
                }>;
                demo_query_play_next: ProtocolStruct<{
                    req: Protocol.QueryPlayNextReq;
                    res: Protocol.QueryPlayNextResp;
                }>;
                demo_continue_play: ProtocolStruct<{
                    req: Protocol.ContinuePlayReq;
                    res: Protocol.ContinuePlayResp;
                }>;
                demo_query_script_opening: ProtocolStruct<{
                    req: Protocol.QueryScriptOpeningReq;
                    res: Protocol.QueryScriptOpeningResp;
                }>;
                demo_refresh_script_opening: ProtocolStruct<{
                    req: Protocol.DemoRefreshScriptOpeningReq;
                    res: Protocol.DemoRefreshScriptOpeningResp;
                }>;
            };
        };
    }
}

export default {};
