// @ts-nocheck
type LinkedNode<T> = LibTypes.VarDefine<{
    value: T,
    front: LinkedNode<T> | null,
    back: LinkedNode<T> | null,
}>;

const createNode = <T>(init: T): LinkedNode<T> => {
    let _value = init;
    let _front: LinkedNode<T> | null = null;
    let _back: LinkedNode<T> | null = null;

    return {
        get value(): T {
            return _value;
        },
        set value(value: T) {
            _value = value;
        },

        get front(): LinkedNode<T> | null {
            return _front;
        },
        set front(value: LinkedNode<T>) {
            _front = value;
        },

        get back(): LinkedNode<T> | null {
            return _back;
        },
        set back(value: LinkedNode<T>) {
            _back = value;
        },
    };
};

export type Dequeue<T> = LibTypes.FrozenDefine<{
    length: number,

    pushFront: (value: T) => void,
    pushBack: (value: T) => void,

    popBack: () => T | null,
    popFront: () => T | null,

    remove: (index: number) => T | null,

    get: (index: number) => T | null,
    insert: (value: T, index: number) => T | null,

    forEach: (
        callbackFn: (value: T, index: number, list: Dequeue<T>) => unknown,
    ) => void,
    find: (
        predicate: (value: T, index: number, list: Dequeue<T>) => unknown,
    ) => T | null,
    toArray: () => LibTypes.VarArr<T>,
}>;

export const createDequeue = <T = undefined>(
    ...args: [] | [params: LibTypes.Arr<T> | T]
) => {
    let _head: LinkedNode<T> | null = null;
    let _tail: LinkedNode<T> | null = null;

    const params = args[0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const arr = (
        args.length === 0 ? [] : params instanceof Array ? params : [params]
    ) as LibTypes.Arr<T>;
    let _length = arr.length;

    let prev: LinkedNode<T> | null = null;
    for (const value of arr) {
        const node = createNode(value);

        // set node to _head if not exist
        _head ??= node;

        // link bi-directionally
        if (prev) {
            prev.back = node;
            node.front = prev;
        }

        // set current node previous
        prev = node;
    }

    // set the last previous node to the _tail
    _tail = prev;

    // find node follow the shortest path
    const _moveStep = (index: number) => {
        if (index < 0 && index > _length - 1) {
            return null;
        }

        const isForward = index * 2 < _length;
        let node = isForward ? _head : _tail;
        let step = isForward ? index : _length - index - 1;

        while (step > 0) {
            node = isForward ? (node?.back ?? null) : (node?.front ?? null);
            step--;
        }

        return node;
    };

    const result: Dequeue<T> = {
        get length() {
            return _length;
        },

        pushFront: value => {
            const node = createNode(value);

            if (_head) {
                node.back = _head;
                _head.front = node;
                _head = node;
            } else {
                _tail = node;
                _head = node;
            }

            _length++;
        },

        pushBack: value => {
            const node = createNode(value);

            if (_tail) {
                _tail.back = node;
                node.front = _tail;
                _tail = node;
            } else {
                _tail = node;
                _head = node;
            }

            _length++;
        },

        popFront: () => {
            const node = _head;

            if (node === _tail) {
                _head = null;
                _tail = null;
            } else {
                _head = node?.back ?? null;
                if (_head) _head.front = null;
            }

            _length--;

            return node?.value ?? null;
        },

        popBack: () => {
            const node = _tail;

            if (node === _head) {
                _head = null;
                _tail = null;
            } else {
                _tail = node?.front ?? null;
                if (_tail) _tail.back = null;
            }

            _length--;

            return node?.value ?? null;
        },

        remove: index => {
            const target = _moveStep(index);

            // Return if targe node is not found
            if (!target) return null;

            // Update head if needed
            if (index === 0) {
                _head = _head?.back ?? null;
            }

            // Update tail if needed
            if (index === _length - 1) {
                _tail = _tail?.front ?? null;
            }

            // Remove target by connect front node and back node
            const front = target.front;
            const back = target.back;
            if (front) front.back = back;
            if (back) back.front = front;

            // Update length
            _length--;

            return target.value;
        },

        get: index => {
            const target = _moveStep(index);

            // Return if targe node is not found
            if (!target) return null;

            return target.value;
        },

        insert: (value: T, index: number): T | null => {
            const target = _moveStep(index);

            // Return if targe node is not found
            if (!target) return null;

            const insertNode = createNode(value);

            // Update head and tail if needed
            if (target === _head) _head = insertNode;
            if (target === _tail) _tail = insertNode;

            // Connect front with inserted node, connect inserted node with target
            const front = target.front;
            if (front) {
                front.back = insertNode;
                insertNode.front = front;
            }

            insertNode.back = target;
            target.front = insertNode;

            _length++;

            return value;
        },

        forEach: callbackFn => {
            let node = _head;
            let index = 0;

            while (node) {
                const back = node.back;
                callbackFn(node.value, index++, result);
                node = back;
            }
        },

        find: predicate => {
            let node = _head;
            let index = 0;

            while (node) {
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                if (predicate(node.value, index++, result)) return node.value;
                node = node.back;
            }
            return null;
        },

        toArray: () => {
            const acc = [];
            let node = _head;
            while (node) {
                acc.push(node.value);
                node = node.back;
            }
            return acc;
        },
    };

    return result;
};
