export type {
    //#region Basic
    // Primitive, [better] Primitive
    // Class, // [default-value]
    // Constructor, // [default-value]
    // AbstractClass, // [default-value]
    // AbstractConstructor, // [default-value]
    TypedArray,
    LowercaseLetter, // a-z
    UppercaseLetter, // A-Z
    DigitCharacter, // 0-9 string
    Alphanumeric, // 0-9 a-z A-Z string
    //#endregion

    //#region Utilities
    EmptyObject, // 比{}严格的空对象
    NonEmptyObject,
    // UnknownRecord, // [better] GeneralObj
    // UnknownArray, // [better] Arr
    UnknownMap,
    UnknownSet,
    // Except, // [better] DefineOmit Omit严格版本
    Writable,
    WritableDeep,
    // Merge, // [better] Assign
    // MergeDeep, // [better] Merge
    // ObjectMerge, // [better] Merge
    MergeExclusive, // 合并成互斥类型
    OverrideProperties, // 重写类型，和Merge不同的是要求必需有相同的key
    RequireAtLeastOne,
    RequireExactlyOne,
    RequireAllOrNone,
    RequireOneOrNone,
    SingleKeyObject, // 只允许唯一键
    RequiredDeep,
    // PickDeep, // [better] DefinePickDeep
    OmitDeep,
    OmitIndexSignature,
    PickIndexSignature,
    PartialDeep,
    PartialOnUndefinedDeep,
    UndefinedOnPartialDeep,
    UnwrapPartial,
    ReadonlyDeep,
    LiteralUnion, // 创建联合类型(用于可能被类型覆盖的情况)
    Tagged, // 创建一个tag的包装类型
    UnwrapTagged, // 解包Tagged类型
    InvariantOf, // 创建一个不可变类型，该类型不能和子类型或超类型相互转换
    SetOptional,
    SetReadonly,
    SetRequired,
    SetRequiredDeep,
    SetNonNullable,
    SetNonNullableDeep,
    // ValueOf, // [better] ValueOf
    ConditionalKeys, // 根据条件获取keys
    ConditionalPick, // 根据条件pick
    ConditionalPickDeep,
    ConditionalExcept,
    UnionToIntersection, // 将联合类型转成交叉类型
    LiteralToPrimitive, // 字面量类型转基本类型
    LiteralToPrimitiveDeep,
    Stringified, // 将所有字段全转为字符串类型
    IterableElement, // 获取迭代器的元素类型
    Entry, // 获取[key, value]元组类型
    Entries,
    SetReturnType,
    SetParameterType,
    Simplify, // 简化类型
    SimplifyDeep,
    Get,
    KeyAsString, // 获取Keys并转成string
    Schema, // 深度Record
    Exact, // 严格匹配
    OptionalKeysOf, // 提取可选键
    KeysOfUnion, // 获取联合类型的所有键
    HasOptionalKeys, // 是否有可选字段
    RequiredKeysOf, // 提取required键
    HasRequiredKeys, // 是否有必填字段
    ReadonlyKeysOf, // 提取readonly键
    HasReadonlyKeys,
    WritableKeysOf,
    HasWritableKeys,
    Spread, // 展开并合并类型
    IsEqual,
    TaggedUnion, // 拆分第一层所有字段，生成联合类型，每个字段key作为type
    IntRange, // 左闭右开
    IntClosedRange, // 左闭右闭
    ArrayIndices, // 获取索引
    ArrayValues,
    ArraySplice,
    ArrayTail, // 去掉第一个元素
    SetFieldType, // 更改字段类型
    Paths, // 生成对象的所有字段路径
    SharedUnionFields, // 生成两个对象共享字段的类型
    SharedUnionFieldsDeep, // 生成两个对象共享字段的深度联合类型
    AllUnionFields, // 将联合类型合并
    DistributedOmit, // 对联合类型分别进行Omit
    DistributedPick, // 对联合类型分别进行Pick
    And,
    Or,
    Xor,
    AllExtend, // [1, number] extends number => true
    // NonEmptyTuple, // 非空元组 [better] MinLengthArray
    // NonEmptyString, [better] NonEmptyString
    FindGlobalType, // 查找全局类型
    FindGlobalInstanceType, // 查找全局构造函数
    ConditionalSimplify, // 按条件Simplify
    ConditionalSimplifyDeep, // 按条件SimplifyDeep
    ExclusifyUnion, // 生成互斥union
    //#endregion

    //#region IS
    // IsLiteral, [better] IsLiteral
    IsStringLiteral,
    IsNumericLiteral,
    IsBooleanLiteral,
    IsSymbolLiteral,
    IsAny,
    IsNever,
    IsUnknown,
    // IsEmptyObject, [better] IsEmptyObject
    // IsNull, [better] IsNull,
    // IsUndefined, [better] IsUndefined,
    IsTuple,
    IsUnion,
    IsLowercase,
    IsUppercase,
    IsOptional,
    // IsNullable, [better] IsNullable
    IsOptionalKeyOf,
    IsRequiredKeyOf,
    IsReadonlyKeyOf,
    IsWritableKeyOf,
    //#endregion

    //#region JSON
    Jsonify,
    Jsonifiable,
    JsonPrimitive,
    JsonObject,
    JsonArray,
    JsonValue,
    //#endregion

    //#region Structured clone
    StructuredCloneable, // 对象满足无损clone
    //#endregion

    //#region Async
    // Promisable, // [default-value]
    AsyncReturnType,
    // Asyncify, [better] Async
    //#endregion

    //#region String
    Trim,
    Split,
    Words, // 智能分割单词
    Replace,
    StringSlice,
    StringRepeat,
    RemovePrefix,
    //#endregion

    //#region Array
    // Arrayable, // [better] Arrayable
    Includes,
    Join,
    ArraySlice,
    ArrayElement,
    LastArrayElement,
    FixedLengthArray, // 创建定长数组
    MultidimensionalArray, // 创建定长多维数组
    MultidimensionalReadonlyArray,
    TupleToUnion, // 元组转联合
    UnionToTuple, // 联合转元组
    TupleToObject, // 元组转对象
    // TupleOf, [better] Tuple
    SplitOnRestElement,
    ExtractRestElement,
    ExcludeRestElement,
    ArrayReverse,
    //#endregion

    //#region Numeric
    PositiveInfinity, // 正无穷
    NegativeInfinity, // 负无穷
    Finite, // 有限数字
    Integer,
    Float,
    NegativeFloat,
    Negative,
    NonNegative,
    NegativeInteger,
    NonNegativeInteger,
    IsNegative,
    IsFloat,
    // IsInteger, [better] IsInteger
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Sum,
    Subtract, // 减法
    //#endregion

    //#region Change Case
    CamelCase,
    CamelCasedProperties,
    CamelCasedPropertiesDeep,
    KebabCase,
    KebabCasedProperties,
    KebabCasedPropertiesDeep,
    PascalCase,
    PascalCasedProperties,
    PascalCasedPropertiesDeep,
    SnakeCase,
    SnakeCasedProperties,
    SnakeCasedPropertiesDeep,
    ScreamingSnakeCase,
    DelimiterCase, // 自定义链接符
    DelimiterCasedProperties,
    DelimiterCasedPropertiesDeep,
    //#endregion

    //#region Miscellaneous
    GlobalThis,
    PackageJson,
    TsConfigJson,
    //#endregion

    //#region Improved built-in
    ExtendsStrict, // 严格版 Extends
    ExtractStrict, // 严格版
    ExcludeStrict, // 严格版
    //#endregion
} from 'type-fest';
export type { ReadonlyDeepIgnore } from 'type-fest';

export type {
    Exist,
    UnExist,
    Primitive,
    NonNullablePrimitive,
    UnboundedPrimitive,
    SimpleObjKey,
    Reference,
    FrozenGeneralObj,
    GeneralObj,
    VarGeneralObj,
} from './@base/general';
export type {
    LooseClass,
    Class,
    Constructor,
    AbstractClass,
    AbstractConstructor,
} from './@base/class';
export type {
    SafeError,
    Promisable,
    TimerHandle,
    ImmediateHandle,
} from './@base/special';
export type {
    FrozenDefine,
    Define,
    VarDefine,
    FrozenPick,
    FrozenPickDeep,
    DefinePick,
    DefinePickDeep,
    VarPick,
    VarPickDeep,
    FrozenOmit,
    DefineOmit,
    VarOmit,
    FrozenOmitLoose,
    DefineOmitLoose,
    VarOmitLoose,
} from './@base/define';
export type {
    IsExtends,
    Is2WayExtends,
    IsPrimitiveEqual,
    IsTrue,
    IsFalse,
    Not,
    IsAnyOrNever,
    IsNull,
    IsUndefined,
    IsUnExist,
    IsNullable,
    IsInteger,
    IsPartialObject,
    IsHasLiteral,
    IsHasUnbounded,
    IsLiteral,
    IsUnbounded,
    IsSafe,
    IsSubObject,
    IsExplicit,
    IsExplicitReference,
    IsExplicitObject,
    IsLooseExplicit,
    IsLooseExplicitReference,
    IsLooseExplicitObject,
} from './@base/is';
export type {
    VerifyExtends,
    VerifyLooseEqual,
    VerifyEqual,
} from './@base/verify';
export type {
    OverrideConditional,
    OverrideIfAny,
    OverrideIfAnyOrNever,
    OverrideIfUnknown,
    OverrideIfUnsafe,
    OverrideIfUnexplicit,
    OverrideIfUnequal,
    OverrideIfEqual,
    OverrideNullableValue,
    OverrideNullable,
    OverrideIfNonSubObject,
} from './@base/override';
export type {
    Arr,
    VarArr,
    Tuple,
    VarTuple,
    Arrayable,
    VarArrayable,
    MinLengthArray,
    VarMinLengthArray,
} from './@base/array';
export type {
    Func,
    LooseArgumentsFunc,
    Async,
    Asyncable,
    SimpleFunction,
    SimpleAsync,
    SimpleAsyncable,
} from './@base/function';
export type {
    ExcludeConditionalKeys,
    ClassStaticFields,
    PickWritable,
    PickWritableDeep,
    PickAllowUndefined,
    AllowUndefinedKeysOf,
    PickNonNever,
    NonNeverKeysOf,
    PickObject,
    ObjectKeysOf,
    PickNonObject,
    NonObjectKeysOf,
    PickFunction,
    FunctionKeysOf,
    PickNonFunction,
    NonFunctionKeysOf,
} from './@base/picker';

export type {
    Nullable,
    NullableIfAllowLoose,
    NullableIfAllow,
} from './nullable';
export type { NonEmptyString } from './non-empty-string';
export type { ValueOf } from './value-of';
export type { Assign } from './assign';
export type { ConstructorTupleToInstance } from './constructor-tuple-to-instance';
export type { Merge } from './merge';
export type { PartialIgnoreArray } from './partial-ignore-array';
export type { SetNullable } from './set-nullable';
export type { RequiredKeepUndefined } from './required-keep-undefined';
export type { AssignTuple } from './assign-tuple';
export type {
    InferGeneralObjDefaultTypeParam,
    InferGeneralObjDefaultTypeParamIgnoreNever,
} from './infer-default-type-param';
export type {
    LooseDefinePick,
    LooseShallowDefinePick,
    LooseVarDefinePick,
} from './loose-pick';
export type { LooseSetOptional } from './loose-set-optional';
export type { AssignFields } from './assign-fields';
export type { PartialOnUndefined } from './partial-on-undefined';
export type { TupleConcat } from './tuple-concat';
export type { OptionalArgumentsIfAllow } from './arguments-optional-if-allow';
export type {
    InferStringTemplateValues,
    InferStringTemplateTag,
} from './infer-string-template';
export type { WritableKeysDeepOf } from './writable-keys-deep-of';
export type { KeyValueUnion } from './key-value-union';
export type { UpdaterValue, UpdaterNewValue } from './updater-value';
export type {
    BaseEventName,
    EventsDefine,
    BaseEventMap,
    EmitEvent,
    ListenerLike,
    AddEventListener,
    RemoveAllEventListeners,
    RemoveEventListener,
    OriginalCallEventMap,
    OriginalCallEventCallbackInfo,
    CallListener,
} from './events-define';

export as namespace LibTypes;
