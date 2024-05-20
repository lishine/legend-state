import { useEffect } from 'react';
import { isPromise } from '../is';
import { useEffectOnce } from './useEffectOnce';

export function useMount(fn: () => (void | (() => void)) | Promise<void>) {
    return useEffect(() => {
        const ret = fn();
        // Allow the function to be async but if so ignore its return value
        if (!isPromise(ret)) {
            return ret;
        }
    }, []);
}

export const useMountOnce = useEffectOnce;
