import {createCallback, exportCallbacks} from '../src';

describe('exportCallbacks', () => {
    test('exports an empty object by default', () => {
        const actual = exportCallbacks();
        expect(actual).toEqual({});
    });

    test('exports subscribe functions for each callback', () => {
        const foo = createCallback();
        const bar = createCallback();

        const exported = exportCallbacks({foo, bar});

        expect(exported).toEqual({
            foo: foo.subscribe,
            bar: bar.subscribe
        });
    });

    test('omits keys that do not have subscribe functions', () => {
        const withSubscribe = createCallback();
        const withoutSubscribe = {};

        const exported = exportCallbacks({withSubscribe, withoutSubscribe});
        expect(exported).not.toHaveProperty('withoutSubscribe');
    });

    test('omits keys that are null', () => {
        const withSubscribe = createCallback();
        const nullItem = null;

        const exported = exportCallbacks({withSubscribe, nullItem});
        expect(exported).not.toHaveProperty('nullItem');
    });
});
