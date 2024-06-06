import { getProxy, set as setBase } from './ObservableObject';
import { batch, notify } from './batching';
import { createObservable } from './createObservable';
import { getNode, getNodeValue, setNodeValue } from './globals';
import { isObservable, lockObservable } from './helpers';
import { isPromise } from './is';
import { observable } from './observable';
import { ObservableComputed, ObservableComputedTwoWay, ObservableReadable, WithState } from './observableInterfaces';
import { observe } from './observe';
import { onChange } from './onChange';

export function computed<T extends ObservableReadable>(compute: () => T | Promise<T>): T & WithState;
export function computed<T>(compute: () => Promise<T>): ObservableComputed<T & WithState>;
export function computed<T>(compute: () => T): ObservableComputed<T>;
export function computed<T, T2 = T>(
    compute: (() => T | Promise<T>) | ObservableReadable<T>,
    set: (value: T2) => void,
): ObservableComputedTwoWay<T, T2>;
export function computed<T, T2 = T>(
    compute: (() => T | Promise<T>) | ObservableReadable<T>,
    set?: (value: T2) => void,
): ObservableComputed<T> | ObservableComputedTwoWay<T, T2> {
    // Create an observable for this computed variable
    const obs = observable<T>();
    lockObservable(obs, true);

    const node = getNode(obs);
    node.isComputed = true;
    let isSetAfterActivated = false;

    const setInner = function (val: any) {
        const prevNode = node.linkedToNode;
        // If it was previously linked to a node remove self
        // from its linkedFromNodes
        if (prevNode) {
            prevNode.linkedFromNodes!.delete(node);
            node.linkedToNode = undefined;
        }

        const { parentOther } = node;

        if (isObservable(val)) {
            // If the computed is a proxy to another observable
            // link it to the target observable
            const linkedNode = getNode(val);
            node.linkedToNode = linkedNode;
            if (!linkedNode.linkedFromNodes) {
                linkedNode.linkedFromNodes = new Set();
            }
            linkedNode.linkedFromNodes.add(node);
            if (node.parentOther) {
                onChange(
                    linkedNode,
                    ({ value }) => {
                        setNodeValue(node.parentOther!, value);
                    },
                    { initial: true },
                );
            }

            // If the target observable is different then notify for the change
            if (prevNode) {
                const value = getNodeValue(linkedNode);
                const prevValue = getNodeValue(prevNode);
                notify(node, value, prevValue, 0);
            }
        } else if (val !== obs.peek()) {
            // Unlock computed node before setting the value
            lockObservable(obs, false);

            const setter = isSetAfterActivated ? setBase : setNodeValue;
            // Update the computed value
            setter(node, val);

            // If the computed is a child of an observable set the value on it
            if (parentOther) {
                let didUnlock = false;
                if (parentOther.root.locked) {
                    parentOther.root.locked = false;
                    didUnlock = true;
                }
                setter(parentOther, val);
                if (didUnlock) {
                    parentOther.root.locked = true;
                }
            }

            // Re-lock the computed node
            lockObservable(obs, true);
        } else if (parentOther) {
            setNodeValue(parentOther, val);
        }

        isSetAfterActivated = true;
    };

    // Lazily activate the observable when get is called
    node.root.activate = () => {
        node.root.activate = undefined;
        let first = true;
        observe(
            compute,
            ({ value }) => {
                if (isPromise(value)) {
                    if (!node.state) {
                        node.state = createObservable(
                            {
                                isLoaded: false,
                            },
                            false,
                            getProxy,
                        ) as any;
                    }

                    if (first) {
                        setInner(undefined);
                        value
                            .then((v) => {
                                node.state!.isLoaded.set(true);
                                setInner(v);
                            })
                            .catch((error) => {
                                node.state!.error.set(error);
                            });
                        first = false;
                    } else {
                        promiseState(value).then((state) => {
                            if (state === 'fulfilled') {
                                value.then((v) => {
                                    setInner(v);
                                    node.state!.isLoaded.set(true);
                                });
                            } else if (state === 'pending') {
                                node.state!.isLoaded.set(false);
                                setInner(undefined);
                                value
                                    .then((v) => {
                                        setInner(v);
                                        node.state!.isLoaded.set(true);
                                    })
                                    .catch((error) => {
                                        node.state!.error.set(error);
                                    });
                            }
                        });
                    }
                } else {
                    setInner(value);
                }
            },
            { immediate: true, fromComputed: true },
        );
    };

    if (set) {
        node.root.set = (value: any) => {
            batch(() => set(value));
        };
    }

    return obs as any;
}

const promiseState = (p: Promise<any>): Promise<'pending' | 'fulfilled' | 'rejected'> => {
    const t = {};
    return Promise.race([p, t]).then(
        (v) => (v === t ? 'pending' : 'fulfilled'),
        () => 'rejected',
    );
};
