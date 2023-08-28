import 'fake-indexeddb/auto';
import { adjustSaveData, persistObservable } from '../src/persist/persistObservable';
import { ObservablePersistLocalStorage } from '../src/persist-plugins/local-storage';

function promiseTimeout(time?: number) {
    return new Promise((resolve) => setTimeout(resolve, time || 0));
}

describe('Creating', () => {
    test('Create with object', () => {
        const [obs$, state$] = persistObservable(
            { test: 'hi' },
            {
                pluginLocal: ObservablePersistLocalStorage,
                local: 'jestlocal',
            },
        );

        expect(obs$.get()).toEqual({ test: 'hi' });

        expect(state$.isLoadedLocal.get()).toEqual(true);
    });
});

describe('Adjusting data', () => {
    test('adjustSaveData with adjustData', () => {
        const adjusted = adjustSaveData({ id: 'id', text: 'a' }, [], [], {
            adjustData: {
                save: (value) => {
                    value.text = 'b';
                    return value;
                },
            },
        });

        expect(adjusted).toEqual({ path: [], value: { id: 'id', text: 'b' } });
    });
    test('adjustSaveData with adjustData and fieldTransforms', () => {
        const adjusted = adjustSaveData({ id: 'id', text: 'a' }, [], [], {
            adjustData: {
                save: (value) => {
                    value.text = 'b';
                    return value;
                },
            },
            fieldTransforms: {
                id: 'id',
                text: 't',
            },
        });

        expect(adjusted).toEqual({ path: [], value: { id: 'id', t: 'b' } });
    });
    test('adjustSaveData with adjustData and fieldTransforms and path', () => {
        const adjusted = adjustSaveData({ id: 'id', text: 'a' }, ['path'], ['object'], {
            adjustData: {
                save: (value) => {
                    value.path.text = 'b';
                    return value;
                },
            },
            fieldTransforms: {
                _dict: {
                    id: 'id',
                    text: 't',
                },
            },
        });

        expect(adjusted).toEqual({ path: ['path'], value: { id: 'id', t: 'b' } });
    });
    test('adjustSaveData with adjustData promise and fieldTransforms and path', async () => {
        const adjusted = await adjustSaveData({ id: 'id', text: 'a' }, ['path'], ['object'], {
            adjustData: {
                save: async (value) => {
                    value.path.text = 'b';
                    await promiseTimeout(10);
                    return value;
                },
            },
            fieldTransforms: {
                _dict: {
                    id: 'id',
                    text: 't',
                },
            },
        });

        expect(adjusted).toEqual({ path: ['path'], value: { id: 'id', t: 'b' } });
    });
});
