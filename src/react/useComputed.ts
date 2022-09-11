import { effect, setupTracking, symbolUndef, tracking } from '@legendapp/state';
import { useEffect } from 'react';
import { useForceRender } from './useForceRender';

export function useComputed<T>(selector: () => T, alwaysUpdate?: boolean) {
    let inRun = true;

    let ret: T = symbolUndef as unknown as T;
    let cachedNodes;

    const fr = useForceRender();

    const update = function () {
        // If running, run and return the value
        // Don't need to run the selector again if not running and alwaysUpdate
        if (inRun || !alwaysUpdate) {
            const cur = selector();
            // Re-render if not currently rendering and value has changed
            if (!inRun && cur !== ret) {
                // Re-render if value changed
                fr();
            }
            ret = cur;
        } else if (alwaysUpdate) {
            fr();
        }
        inRun = false;

        // Workaround for React 18's double calling useEffect - cached the tracking nodes
        if (process.env.NODE_ENV === 'development') {
            cachedNodes = tracking.nodes;
        }
    };

    let dispose = effect(update);

    if (process.env.NODE_ENV === 'development') {
        useEffect(() => {
            // Workaround for React 18's double calling useEffect. If this is the
            // second useEffect, set up tracking again.
            if (dispose === undefined) {
                dispose = setupTracking(cachedNodes, update);
            }
            return () => {
                dispose();
                dispose = undefined;
            };
        });
    } else {
        // Return dispose to cleanup before each render or on unmount
        useEffect(() => dispose);
    }

    return ret;
}
