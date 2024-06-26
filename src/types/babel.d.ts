import type { ObservableParam } from '@legendapp/state';
import { ReactNode } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Computed, Memo } from '@legendapp/state/react';
declare module '@legendapp/state/react' {
    export declare const Computed: (props: {
        children: ObservableParam | (() => ReactNode) | ReactNode;
    }) => React.ReactElement;
    export declare const Memo: (props: {
        children: ObservableParam | (() => ReactNode) | ReactNode;
    }) => React.ReactElement;
}
