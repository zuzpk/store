import { useMemo, useRef, useSyncExternalStore } from "react";
import createDispatcher from "./dispatch";
import { contextRegistry, getStoreState, subscribeStore } from "./registry";
import { Store } from "./types";

const strictEqual = <T,>(a: T, b: T) => Object.is(a, b);

const useStore = <T,>(
    key: string, 
    selector?: (state: any) => T,
    equalityFn: (a: T, b: T) => boolean = strictEqual
) : Store<T> => {

    const contextEntry = contextRegistry[key];
    if (!contextEntry) {
        throw new Error([
            `Context with key "${key}" not found.`,
            `Available contexts: ${Object.keys(contextRegistry).join(`, `)}`
        ].join(` `));
    }

    const lastSelectedRef = useRef<T | undefined>(undefined);
    const hasSelectionRef = useRef(false);

    const selectedState = useSyncExternalStore(
        (listener) => subscribeStore(key, listener),
        () => {
            const state = getStoreState(key);
            const selected = selector ? selector(state) : (state as T);

            if (!hasSelectionRef.current) {
                hasSelectionRef.current = true;
                lastSelectedRef.current = selected;
                return selected;
            }

            const prevSelected = lastSelectedRef.current as T;
            if (equalityFn(prevSelected, selected)) {
                return prevSelected;
            }

            lastSelectedRef.current = selected;
            return selected;
        },
        () => {
            const state = getStoreState(key);
            return selector ? selector(state) : (state as T);
        }
    );

    // Memoize dispatcher — createDispatcher is now a plain function (not a hook),
    // so this is safe.
    const dispatch = useMemo(
        () => createDispatcher(key),
        [key]
    );

    return {
        ...selectedState,
        dispatch,
    }

}

export default useStore