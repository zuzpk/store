import { useContext, useMemo } from "react";
import createDispatcher from "./dispatch";
import { contextRegistry } from "./registry";
import { Store } from "./types";

const useStore = <T,>(
    key: string, 
    selector?: (state: any) => T
) : Store<T> => {

    const contextEntry = contextRegistry[key];
    if (!contextEntry) {
        throw new Error([
            `Context with key "${key}" not found.`,
            `Available contexts: ${Object.keys(contextRegistry).join(`, `)}`
        ].join(` `));
    }

    const { context } = contextEntry

    const value = useContext(context)

    if (!value) throw new Error("Context not provided.");

    const selectedState = selector ? selector(value) : value;

    // Memoize dispatcher — createDispatcher is now a plain function (not a hook),
    // so this is safe. value.dispatch is stable (useCallback + stable _dispatch).
    const dispatch = useMemo(
        () => createDispatcher(key, value.dispatch),
        [key, value.dispatch]
    );

    return {
        ...selectedState,
        dispatch,
    }

}

export default useStore