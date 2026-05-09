// @ts-nocheck
import { useCallback, useMemo } from 'react';
import { CharacterController } from '$/controllers';
import { CharacterEnums } from '$/enums';
import {
    useListenEvent,
    usePopup,
    useReactive,
    useRegisterRenderController,
    useZoneController,
} from '$/hooks';
import type { CharacterTypes, ReactTypes } from '$/types';
import { optimize } from '$/view';
import { ArtStyleList } from '../art-style-list/art-style-list-ui';
import { AttributeItem } from './@parts/attribute-item';
import { I18nTexts, Settings } from './character-digest-const';
import { CharacterDigestController } from './character-digest-controller';

type Props = LibTypes.FrozenDefine<
    {
        data: CharacterTypes.FrozenCharacterInfo,
        showSpecies?: boolean,
        showSocialCount?: boolean,
        showArtStyle?: boolean,
        showTimbre?: boolean,
        clickable?: boolean,
        genderClickable?: boolean,
        speciesClickable?: boolean,
        relationClickable?: boolean,
        socialCountClickable?: boolean,
        artStyleClickable?: boolean,
        timbreClickable?: boolean,
        genderShowIcon?: boolean,
        itemType?: 'card' | 'tag',
        submitToRemote?: boolean,
    },
    'data'
>;

export const CharacterDigest: ReactTypes.FC<Props> = optimize(props => {
    const popup = usePopup();
    const characterCtrl = useZoneController(CharacterController);

    const needRequestTimbres = useMemo(
        () => (props.showTimbre ?? true) && (props.timbreClickable ?? props.clickable ?? true),
        [props.clickable, props.showTimbre, props.timbreClickable],
    );

    const [ctrl, RenderParentProvider] = useRegisterRenderController(
        CharacterDigestController,
        { data: props.data, needRequestTimbres, submitToRemote: !!props.submitToRemote },
    );

    useMemo(() => {
        ctrl.needRequestTimbres(needRequestTimbres);
        ctrl.submitToRemote(!!props.submitToRemote);
    }, [needRequestTimbres, props.submitToRemote]);

    const reactiveState = useReactive(() => ({
        dataState: { ...ctrl.state.data.state },
        speciesList: ctrl.state.speciesList,
        artStyleList: ctrl.state.artStyleList,
        showArtStyleList: ctrl.state.showArtStyleList,
    }));

    useMemo(() => { ctrl.setData(props.data); }, [props.data]);

    const showSpecies = props.showSpecies ?? true;
    const showSocialCount = props.showSocialCount ?? true;
    const showArtStyle = props.showArtStyle ?? true;
    const showTimbre = props.showTimbre ?? true;
    const clickable = props.clickable ?? true;
    const itemType = props.itemType ?? 'tag';

    const socialCount = useMemo(
        () => reactiveState.dataState.relationships?.length ?? 0,
        [reactiveState.dataState.relationships?.length],
    );

    const genderInfo = useMemo(() => {
        const gender = reactiveState.dataState.gender;
        if (gender == null) return null;
        const genderTextMap = {
            [CharacterEnums.Gender.Girl]: '女',
            [CharacterEnums.Gender.Boy]: '男',
            [CharacterEnums.Gender.Other]: '非人',
        };
        return { text: genderTextMap[gender] ?? String(gender) };
    }, [reactiveState.dataState.gender]);

    const artStyleInfo = useMemo(
        () => reactiveState.dataState.initial?.artStyle,
        [reactiveState.dataState.initial?.artStyle],
    );

    // 性别点击
    const handleGenderPress = useCallback(() => {
        const genderOptions = [
            { label: '女', value: String(CharacterEnums.Gender.Girl) },
            { label: '男', value: String(CharacterEnums.Gender.Boy) },
            { label: '非人', value: String(CharacterEnums.Gender.Other) },
        ];
        popup.openMenu({
            optionList: genderOptions,
            value: String(reactiveState.dataState.gender),
            anchor: 'bottom-left',
            onChange: (_label, option) => {
                ctrl.updateGender(Number(option.value) as CharacterEnums.Gender);
                popup.closeMenu();
            },
        });
    }, [reactiveState.dataState.gender]);

    // 物种点击
    const handleSpeciesPress = useCallback(() => {
        const speciesList = reactiveState.speciesList;
        const speciesOptions = speciesList.map(s => ({ label: s.name, value: s.id }));
        const customSpeciesOptions = characterCtrl.state.menuCustomSpeciesList.map(s => ({
            label: s.name, value: s.id,
        }));
        popup.openMenu({
            optionList: speciesOptions,
            value: reactiveState.dataState.species == null ? null : reactiveState.dataState.species.id,
            anchor: 'bottom-left',
            allowAdd: true,
            inputName: I18nTexts.speciesInputName,
            placeholder: I18nTexts.speciesPlaceholder,
            defaultCustomOptions: customSpeciesOptions,
            onDeleteCustomOption: option => {
                const id = option.value;
                characterCtrl.deleteMenuCustomSpecies(id);
                if (id === reactiveState.dataState.species?.id) {
                    const defaultSpecies = reactiveState.speciesList[0];
                    if (defaultSpecies) ctrl.updateSpecies(defaultSpecies);
                }
            },
            onChange: (_, option) => {
                const species = [
                    ...reactiveState.speciesList,
                    ...characterCtrl.state.menuCustomSpeciesList,
                ].find(item => item.id === option.value);
                if (species) {
                    ctrl.updateSpecies(species);
                } else {
                    const newSpecies = characterCtrl.pushMenuCustomSpecies(option.label);
                    ctrl.updateSpecies(newSpecies);
                }
                popup.closeMenu();
            },
        });
    }, [reactiveState.speciesList, reactiveState.dataState.species?.id]);

    // 关系点击
    const handleRelationPress = useCallback(() => {
        popup.openDualInputDialog({
            titleInputName: I18nTexts.relationTitleInputName,
            titleInputMaxLength: 10,
            descInputName: I18nTexts.relationDescInputName,
            descInputMaxLength: 50,
            defaultValues: reactiveState.dataState.relation && {
                title: reactiveState.dataState.relation.title,
                desc: reactiveState.dataState.relation.regard,
            },
            descRequired: false,
            onOk: values => {
                ctrl.updateRelation(values.title, values.desc);
                popup.closeDualInputDialog();
                return true;
            },
        });
    }, [reactiveState.dataState.relation]);

    useListenEvent(ctrl, 'noData', () => {
        popup.showToast(I18nTexts.dataGenerating);
    });

    return (
        <RenderParentProvider>
            <div style={{ width: '100%', position: 'relative', overflow: 'visible' }}>
                {/* 画风列表 */}
                {reactiveState.showArtStyleList && (
                    <div style={{ position: 'absolute', bottom: '100%', zIndex: 10, width: '100%' }}>
                        <ArtStyleList
                            list={reactiveState.artStyleList}
                            selectedArtStyleId={artStyleInfo?.id}
                            onSelect={artStyle => {
                                ctrl.updateArtStyle(artStyle);
                                ctrl.hideArtStyleList();
                            }}
                        />
                    </div>
                )}

                {/* 属性横向滚动列表 */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 8,
                    paddingTop: 8,
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                }}>
                    {/* 性别 */}
                    <AttributeItem
                        label={I18nTexts.gender}
                        value={genderInfo?.text}
                        clickable={props.genderClickable ?? clickable}
                        onPress={handleGenderPress}
                        itemType={itemType}
                    />

                    {/* 物种 */}
                    {showSpecies && (
                        <AttributeItem
                            label={I18nTexts.species}
                            value={reactiveState.dataState.species?.name}
                            clickable={props.speciesClickable ?? clickable}
                            onPress={handleSpeciesPress}
                            maxLength={Settings.maxTextLength}
                            itemType={itemType}
                        />
                    )}

                    {/* 关系 */}
                    <AttributeItem
                        label={I18nTexts.relation}
                        value={reactiveState.dataState.relation?.title}
                        clickable={props.relationClickable ?? clickable}
                        onPress={handleRelationPress}
                        maxLength={Settings.maxTextLength}
                        itemType={itemType}
                    />

                    {/* 社交人数 */}
                    {showSocialCount && (
                        <AttributeItem
                            label={I18nTexts.socialCount}
                            value={String(socialCount)}
                            clickable={props.socialCountClickable ?? clickable}
                            onPress={ctrl.toSocialCount}
                            itemType={itemType}
                        />
                    )}

                    {/* 画风 */}
                    {showArtStyle && (
                        <AttributeItem
                            label={I18nTexts.artStyle}
                            value={artStyleInfo?.name}
                            clickable={props.artStyleClickable ?? clickable}
                            onPress={ctrl.toggleArtStyleList}
                            maxLength={Settings.maxTextLength}
                            itemType={itemType}
                        />
                    )}

                    {/* 音色 */}
                    {showTimbre && (
                        <button
                            type="button"
                            onClick={(props.timbreClickable ?? clickable) ? ctrl.showTimbreList : undefined}
                            disabled={!(props.timbreClickable ?? clickable)}
                            style={{
                                backgroundColor: '#1A1A1A',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                padding: 0,
                                cursor: (props.timbreClickable ?? clickable) ? 'pointer' : 'default',
                                flexShrink: 0,
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                height: 32,
                                paddingLeft: 12,
                                paddingRight: 12,
                                gap: 4,
                                opacity: clickable ? 1 : 0.3,
                            }}>
                                {/* 音色图标 */}
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 18V5l12-2v13" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="6" cy="18" r="3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                                    <circle cx="18" cy="16" r="3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                                </svg>
                                {reactiveState.dataState.currentTimbre && (
                                    <img
                                        src={reactiveState.dataState.currentTimbre.icon?.uri}
                                        alt=""
                                        style={{ width: 20, height: 20, borderRadius: 10 }}
                                    />
                                )}
                                {(props.timbreClickable ?? clickable) && (
                                    <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                                        <path d="M1 1l6 5-6 5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                        </button>
                    )}
                </div>
            </div>
        </RenderParentProvider>
    );
});
