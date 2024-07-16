import { extractPromise, getProxy } from './ObservableObject';
import { ObservablePrimitiveClass } from './ObservablePrimitive';
import { createObservable } from './createObservable';
import type { Observable, ObservablePrimitive, RecursiveValueOrFunction } from './observableTypes';

export function observable<T>(): Observable<T | undefined>;
export function observable<T>(
    value: Promise<RecursiveValueOrFunction<T>> | (() => RecursiveValueOrFunction<T>) | RecursiveValueOrFunction<T>,
): Observable<T>;
export function observable<T>(value: T): Observable<T>;
export function observable<T>(value?: T): Observable<any> {
    return createObservable(value, false, extractPromise, getProxy, ObservablePrimitiveClass) as any;
}

export function observablePrimitive<T>(value: Promise<T>): ObservablePrimitive<T>;
export function observablePrimitive<T>(value?: T): ObservablePrimitive<T>;
export function observablePrimitive<T>(value?: T | Promise<T>): ObservablePrimitive<T> {
    return createObservable(value, true, extractPromise, getProxy, ObservablePrimitiveClass) as any;
}

type Primitive = undefined | null | boolean | number | symbol | string;
interface HasToJSON {
    toJSON(): SerializableParam;
}
export type SerializableParam =
    | Primitive
    | HasToJSON
    | ReadonlyArray<SerializableParam>
    | ReadonlySet<SerializableParam>
    | ReadonlyMap<SerializableParam, SerializableParam>
    | Readonly<{ [key: string]: SerializableParam }>;
// type IsParamFunction<T> = T extends (...args: infer P) => any
//     ? P extends { length: 1 }
//         ? P[0] extends SerializableParam
//             ? true
//             : false
//         : false
//     : false;

/**
 * It is a version of ovservable which is similar to lookup table, but callable with an object
 * It is not working typewize with crud/persist/keel etc., this is why it is separated
 */
export function callableObservable<T>(): Observable<T | undefined>;
export function callableObservable<T, P extends void>(value: (p: P) => RecursiveValueOrFunction<T>): Observable<T>;
export function callableObservable<T, P extends string>(
    value: (p: P) => RecursiveValueOrFunction<T>,
): Observable<(p: P) => T>;
export function callableObservable<T, P extends ObservablePrimitive<string>>(
    value: (p: P) => RecursiveValueOrFunction<T>,
): Observable<(p: P) => T>;
export function callableObservable<T, P extends number>(
    value: (p: P) => RecursiveValueOrFunction<T>,
): Observable<(p: P) => T>;
export function callableObservable<T, P extends ObservablePrimitive<number>>(
    value: (p: P) => RecursiveValueOrFunction<T>,
): Observable<(p: P) => T>;
export function callableObservable<T, P extends Record<string, SerializableParam>>(
    value: (p: P) => RecursiveValueOrFunction<T>,
): (p: P) => Observable<T>;
export function callableObservable<T>(
    value: Promise<RecursiveValueOrFunction<T>> | (() => RecursiveValueOrFunction<T>) | RecursiveValueOrFunction<T>,
): Observable<T>;
export function callableObservable<T>(value: T): Observable<T>;
export function callableObservable<T>(value?: T): any {
    if (typeof value === 'function') {
        (value as any).__stringify_param = true;
    }
    return createObservable(value, false, extractPromise, getProxy, ObservablePrimitiveClass) as any;
}
