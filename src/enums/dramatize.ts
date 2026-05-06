export enum SpecialEffectKind {
    Vibrate = 1,
    Shake = 2,
    SceneFilmFilter = 3,
}

export enum DirectorSpecialEffectKind {
    Vibrate = 1,
    Shake = 2,
}

export enum DirectorSceneSpecialEffectKind {
    Shake = 'Shake',
    FilmFilter = 'FilmFilter',

    Rain = 'Rain',
    Storm = 'Storm',
    SlantRain = 'SlantRain',
    Fire = 'Fire',
    Lightning = 'Lightning',
    Arc = 'Arc',
    Snow = 'Snow',
    Blizzard = 'Blizzard',
    Crystal = 'Crystal',
    Embers = 'Embers',
    Fireworks = 'Fireworks',
    Bokeh = 'Bokeh',
    Heartbeat = 'Heartbeat',
    IntoYou = 'IntoYou',
    Stars = 'Stars',
    Nebula = 'Nebula',
    Flare = 'Flare',
    Laser = 'Laser',
    Pulse = 'Pulse',
    Fog = 'Fog',
    VFog = 'VFog',
    Cloud = 'Cloud',
    Sandy = 'Sandy',
    Ocean = 'Ocean',
    Caustic = 'Caustic',
    Bonfire = 'Bonfire',
    Blaze = 'Blaze',
    VHS = 'VHS',
}

export enum ActionKind {
    NextStep = 0,
    Active = 1,
    Animation = 2,
    SetStyle = 3,
    AddSpecialEffect = 4,
    Play = 5,
    PlayToMS = 6,
    PlayToIndex = 7,
    Volume = 8,
    Show = 9,
    SetStyleFromUnit = 10,
    SetRoleCount = 11,
    ClearAnimated = 22,
    ClearChildren = 23,
    ClearSpecialEffect = 24,
    SetProcess = 25,
    NarrativeBegin = 26,
    NarrativeEnd = 27,
    SetTextContent = 28,

    SetStyleFromElement = 99,

    SceneAnimation = 100,
    SceneSpecialEffect = 101,
    SceneSetStyle = 102,
}

export enum TextKind {
    Default = 1,
    NewRole = 2,
    NewScene = 3,
}

export enum UnitKind {
    Process = 0,

    Text = 1,
    Audio = 2,
    Image = 3,
    Frames = 4,
    Video = 5,
    Lottie = 6,
    Container = 7,
    // Filter = 7,
    Options = 8,
    // Input = 9,
    Scene = 10,
    Slot = 11,
    // Slot = 11,
}

export enum ConditionOperator {
    And = 1,
    Or = 2,
}

export enum StepKind {
    Loaded = 1,
    Loading = 2,
    End = 3,
}

export enum InputMode {
    Text = 1,
    Voice = 2,
}

export enum UnitSize {
    Small = 1,
    Smaller = 2,
    Tiny = 3,
}

export enum OriginKind {
    Default = 1,
    FaceTop = 2,
    FaceRight = 3,
    FaceBottom = 4,
    FaceLeft = 5,
    FaceCenter = 6,
}

export enum SpecialEffectScope {
    Scene = 1,
    Element = 2,
}
