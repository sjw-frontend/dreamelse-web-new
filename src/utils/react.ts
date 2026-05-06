import { type ReactNode, isValidElement } from 'react';
import { Trans } from 'react-i18next';

import type { ReactTypes } from '$/types';

// TODO PromiseReactNode 待验证
export const isReactNode = (node: unknown): node is ReactNode => {
    const result = isSimpleReactNode(node);

    if (result) {
        return result;
    }

    if (node instanceof Array) {
        return node.every(item => isReactNode(item));
    }

    return isValidElement(node);
};

export const isSimpleReactNode = (
    node: unknown,
): node is ReactTypes.SimpleNode => {
    if (node == null) {
        return true;
    }

    if (
        typeof node === 'string' ||
        typeof node === 'number' ||
        typeof node === 'bigint' ||
        typeof node === 'boolean'
    ) {
        return true;
    }

    return false;
};

export const isTextNode = (node: unknown): node is ReactTypes.TextNode =>
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'bigint';

export const isI18nTextNode = (node: ReactNode) =>
    isTextNode(node) || (isValidElement(node) && node.type === Trans);
