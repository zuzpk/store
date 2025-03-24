import { useContext } from "react";
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

    return {
        ...selectedState,
        dispatch: createDispatcher({ key, context })
    }

}

export default useStore