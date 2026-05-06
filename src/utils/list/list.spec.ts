// @ts-nocheck
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { createDequeue } from '.';

describe('list data struct', () => {
    afterEach(() => {
        jest.useRealTimers();
    });
    it('create a list from a fixed array', () => {
        const arr = [1, 2, 3, 4, 5];
        const list = createDequeue(arr);

        // Test head node
        expect(list.get(0)).toEqual(1);

        // Test tail node
        expect(list.get(list.length - 1)).toEqual(5);

        // Test remove head node
        list.remove(0);
        expect(list.length).toEqual(4);
        expect(list.toArray()).toEqual([2, 3, 4, 5]);

        // Test remove backward
        list.remove(list.length - 2);
        expect(list.length).toEqual(3);
        expect(list.toArray()).toEqual([2, 3, 5]);

        // Test push front node
        list.pushFront(1);
        expect(list.length).toEqual(4);
        expect(list.toArray()).toEqual([1, 2, 3, 5]);

        // Test push back node
        list.pushBack(5);
        expect(list.toArray()).toEqual([1, 2, 3, 5, 5]);
        expect(list.length).toEqual(5);
        expect(list.get(list.length - 1)).toEqual(5);

        // Test remove node at the middle of list
        list.remove(2);
        expect(list.toArray()).toEqual([1, 2, 5, 5]);

        // Test get item by index
        expect(list.get(1)).toEqual(2);
        expect(list.get(3)).toEqual(5);
    });

    it('create a list from an empty arr', () => {
        const list = createDequeue<number>(...[]);

        // Test empty list
        expect(list.get(0)).toEqual(null);
        expect(list.get(list.length - 1)).toEqual(null);

        // Test push back 1
        list.pushBack(1);
        expect(list.get(0)).toEqual(list.get(list.length - 1));

        // Test pop front
        const value = list.popFront();
        expect(value).toEqual(1);
    });

    it('create a list from undefined', () => {
        const list = createDequeue<number>();

        // Test push front 2
        list.pushFront(2);
        expect(list.get(0)).toEqual(2);

        // Test pop back
        const value = list.popBack();
        expect(value).toEqual(2);
    });

    it('test list forEach', () => {
        const listWithElements = createDequeue([1, 2, 3, 4]);

        // Test iterate list with multiple nodes
        listWithElements.forEach((value, index, list) => {
            expect(value).toEqual(index + 1);
            expect(list).toEqual(list);
        });

        // Test iterate a list without any node
        const emptyList = createDequeue(...[]);
        const iterateFn = jest.fn();
        emptyList.forEach(iterateFn);
        expect(iterateFn).not.toHaveBeenCalled();

        // Test remove node during iteration
        const trace: LibTypes.VarArr<number> = [];
        listWithElements.forEach((value, index) => {
            if (value === 3) {
                listWithElements.remove(index);
            } else {
                trace.push(value);
            }
        });
        expect(trace).toEqual([1, 2, 4]);
        expect(listWithElements.toArray()).toEqual([1, 2, 4]);
        expect(listWithElements.length).toEqual(3);
    });

    it('test find node', () => {
        // Test find node when target node exist
        const listWithElements = createDequeue([1, 2, 3, 4, 5]);
        const target = listWithElements.find(value => value === 4);
        expect(target).toEqual(4);

        // Test find node when target node doesn't exist
        const impossibleTarget = listWithElements.find(() => false);
        expect(impossibleTarget).toEqual(null);

        // Test find node in an empty list
        const emptyList = createDequeue();
        const iterateFn = jest.fn<() => boolean>();
        emptyList.find(iterateFn);
        expect(iterateFn).not.toHaveBeenCalled();

        const missingTarget = emptyList.find(() => true);
        expect(missingTarget).toEqual(null);
    });
});
